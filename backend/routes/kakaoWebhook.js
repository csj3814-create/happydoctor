const express = require('express');
const router = express.Router();
const { analyzeAndRouteTriage, analyzeFollowUp } = require('../services/llmService');
const { enqueueDoctorNotification } = require('../services/notifyService');
const followUpService = require('../services/followUpService');
const dbService = require('../services/dbService');

/**
 * 카카오 i 오픈빌더 Webhook Endpoint
 * 
 * 카카오 오픈빌더에서 "예진 완료" 블록 도달 시 이 API를 호출합니다.
 * Body 포맷 (Kakao i Skill Payload):
 * req.body.action.clientExtra 또는 req.body.action.params 에 수집된 파라미터가 들어옴.
 */
router.post('/triage-complete', async (req, res) => {
    try {
        console.log('[Kakao Webhook] Received Triage Data');
        
        // 오픈빌더 payload에서 params + contexts 모두 수집
        const params = req.body.action?.params || {};
        const userId = req.body.userRequest?.user?.id || 'kakao_user_unknown';

        // 컨텍스트에서 파라미터 추출 (이전 블록들에서 출력 컨텍스트로 전달된 값)
        const contextParams = {};
        const contexts = req.body.contexts || [];
        for (const ctx of contexts) {
            if (ctx.params) {
                for (const [key, val] of Object.entries(ctx.params)) {
                    if (val && val.value) contextParams[key] = val.value;
                }
            }
        }

        // params(현재 블록) + contextParams(이전 블록) 병합 (params 우선)
        const merged = { ...contextParams, ...params };
        console.log('[Merged Params]', JSON.stringify(merged));

        // 1. 환자 데이터 수집 (오픈빌더 엔터티명에 따라 매핑)
        const patientData = {
            age: merged.age || '미상',
            gender: merged.gender || '미상',
            cc: merged.chief_complaint || '증상 미확인',
            onset: merged.onset || '알 수 없음',
            symptom: merged.symptom_detail || '상세 내용 없음',
            nrs: merged.nrs || '0',
            associated: merged.associated_symptom || '없음',
            pmhx: merged.past_medical_history || '특이사항 없음'
        };

        // 2. Gemini를 이용해 예진 데이터 분석 및 분기 (자율해결 vs 전문의협진)
        const analysisResult = await analyzeAndRouteTriage(patientData);
        console.log('[Gemini Analysis Result]', analysisResult.action);

        let finalResponseText = '';

        // 3. 분기 처리 로직 (AI 자율해결 vs 전문의협진)
        if (analysisResult.action === 'AUTONOMOUS_REPLY') {
            // [경증] AI가 단독 처리
            finalResponseText = analysisResult.replyToPatient;

            // [추가] 15분 뒤 자동 상태 점검 스케줄링 (경증이라 차트는 없으나 초기 증상 텍스트를 임시 저장)
            const fallbackChart = `[최초 자동 해결된 경증 환자]\n증상: ${patientData.cc}\nNRS: ${patientData.nrs}`;
            followUpService.scheduleFollowUp(userId, fallbackChart, 15);

        } else {
            // [협진 필요] 전문의 큐에 차트 적재 후 대기 안내
            enqueueDoctorNotification(analysisResult.soapChartForDoctor, userId);
            
            // [추가] 고위험 환자도 15분 뒤(또는 의사 답변 지연 시) 상태가 악화되는지 F/U 스케줄링
            followUpService.scheduleFollowUp(userId, analysisResult.soapChartForDoctor, 15);

            // AI가 제안한 1차 안심 멘트에 챗봇 공식 대기 안내 병합
            finalResponseText = analysisResult.replyToPatient + 
                "\n\n🩺 작성해주신 차트를 담당 전문의 선생님들께 보고드렸습니다. 진료 틈틈이 확인하시고 이곳으로 직접 답변을 드릴 예정이니 잠시만 대기해 주세요. (급박한 응급상황 시 지체 없이 119를 부르세요!)" +
                "\n\n🏥 '행복한 의사'는 의료 취약계층 환자분들을 위해 의사들이 자원봉사로 운영하는 비영리 단체입니다. 오늘 상담이 도움이 되셨다면, 이 활동이 계속될 수 있도록 작은 응원을 보내주세요. 💛 [후원 링크 추가 필요]";
        }

        // [추가] 4. Firebase DB에 상담 내역 영구 기록 (비동기 병렬 처리)
        dbService.logConsultation(userId, patientData, analysisResult).catch(err => console.error("DB Log Error:", err));

        // 5. 환자에게 응답 (카카오 i 응답 템플릿 반환)
        return res.status(200).json({
            version: "2.0",
            template: {
                outputs: [
                    {
                        simpleText: {
                            text: finalResponseText
                        }
                    }
                ]
            }
        });

    } catch (error) {
        console.error('[Kakao Webhook Error]', error);
        return res.status(500).json({
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: { text: "죄송합니다. 시스템 오류가 발생하여 예진표를 전송하지 못했습니다. 잠시 후 다시 시도해주세요." }
                }]
            }
        });
    }
});

/**
 * 카카오 i 오픈빌더 F/U(추적 관찰) 환자 응답 웹훅
 * 
 * 15분 뒤 봇이 "상태가 어떠신가요?" 물었을 때, 환자가 대답하면 여기로 옵니다.
 */
router.post('/fu-reply', async (req, res) => {
    try {
        console.log('[Kakao Webhook] Received Follow-Up Reply');
        
        const params = req.body.action?.params || {};
        const userId = req.body.userRequest?.user?.id || 'kakao_user_unknown';

        const nrsChange = params.nrs || '응답 없음';
        const additionalSymptom = params.additional_symptom || '특이사항 없음';

        // 1. 기존 차트 가져오기
        const originalChart = followUpService.getOriginalChart(userId);

        // 2. 증상 변화 AI 분석 (호전/유지 vs 악화)
        const fuAnalysis = await analyzeFollowUp(originalChart, nrsChange, additionalSymptom);
        console.log('[Gemini F/U Analysis Result]', fuAnalysis.action);

        let finalResponseText = fuAnalysis.replyToPatient;

        // 3. 악화 시 전문의 큐 재할당
        if (fuAnalysis.action === 'ESCALATE_FU') {
            enqueueDoctorNotification(`🚨 **[F/U 경고: 증상 악화 감지]**\n${fuAnalysis.fuChartForDoctor}`, userId);
            finalResponseText += "\n\n⚠️ 담당 전문의 선생님께 긴급으로 재보고 드렸습니다. 잠시만 대기해 주시고, 견디기 힘드시면 119를 부르셔야 합니다!";
        } else {
             // 상황 유지/호전 시 F/U 타이머를 1시간 뒤로 연장 (선택사항)
             followUpService.scheduleFollowUp(userId, originalChart, 60); 
        }

        // [추가] 4. F/U 내역에 대한 상태 점검 기록을 추후 홈페이지 조회를 위해 DB에 병합
        dbService.logFollowUp(userId, fuAnalysis).catch(err => console.error("DB F/U Log Error:", err));

        return res.status(200).json({
            version: "2.0",
            template: {
                outputs: [{ simpleText: { text: finalResponseText } }]
            }
        });

    } catch (error) {
        console.error('[Kakao F/U Webhook Error]', error);
        return res.status(500).json({
            version: "2.0",
            template: { outputs: [{ simpleText: { text: "일시적인 오류가 발생했습니다." } }] }
        });
    }
});

module.exports = router;
