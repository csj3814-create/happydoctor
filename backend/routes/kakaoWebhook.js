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
        
        const params = req.body.action?.params || {};
        const userId = req.body.userRequest?.user?.id || 'kakao_user_unknown';
        const callbackUrl = req.body.userRequest?.callbackUrl;

        // 컨텍스트에서 파라미터 추출
        const contextParams = {};
        const contexts = req.body.contexts || [];
        for (const ctx of contexts) {
            if (ctx.params) {
                for (const [key, val] of Object.entries(ctx.params)) {
                    if (val && val.value) contextParams[key] = val.value;
                }
            }
        }

        const merged = { ...contextParams, ...params };
        console.log('[Merged Params]', JSON.stringify(merged));

        // sys.* 엔티티 이름이 그대로 들어온 경우 기본값 처리
        const sanitize = (val, fallback) => {
            if (!val || val.startsWith('sys.')) return fallback;
            return val;
        };

        const patientData = {
            age: sanitize(merged.age, '미상'),
            gender: sanitize(merged.gender, '미상'),
            cc: sanitize(merged.chief_complaint, '증상 미확인'),
            onset: sanitize(merged.onset, '알 수 없음'),
            symptom: sanitize(merged.symptom_detail, '상세 내용 없음'),
            nrs: sanitize(merged.nrs, '0'),
            associated: sanitize(merged.associated_symptom, '없음'),
            pmhx: sanitize(merged.past_medical_history, '특이사항 없음'),
            location: sanitize(merged.location, '미확인'),
            symptomImage: merged.symptom_image || null
        };

        // 대기 중인 F/U 질문이 있으면 새 상담 대신 F/U 질문을 먼저 표시
        const pendingFU = followUpService.consumePendingFollowUp(userId);
        if (pendingFU) {
            console.log(`[F/U Pending] ${userId} — 대기 중인 F/U 질문 전달`);
            return res.status(200).json({
                version: "2.0",
                template: {
                    outputs: [{ simpleText: { text: `⏰ ${pendingFU}` } }]
                }
            });
        }

        if (callbackUrl) {
            // 콜백 모드: 대기 메시지 먼저 반환 후 비동기 처리
            res.status(200).json({
                version: "2.0",
                useCallback: true,
                template: {
                    outputs: [{
                        simpleText: { text: "🩺 입력해주신 증상을 분석하고 있습니다. 잠시만 기다려주세요..." }
                    }]
                }
            });
            processTriageAsync(callbackUrl, userId, patientData);
        } else {
            // 동기 모드: 5초 내 직접 응답
            const result = await processTriageSync(userId, patientData);
            return res.status(200).json(result);
        }

    } catch (error) {
        console.error('[Kakao Webhook Error]', error);
        return res.status(500).json({
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: { text: "죄송합니다. 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }
                }]
            }
        });
    }
});

async function processTriageSync(userId, patientData) {
    try {
        const analysisResult = await analyzeAndRouteTriage(patientData);
        let finalResponseText = '';
        if (analysisResult.action === 'AUTONOMOUS_REPLY') {
            finalResponseText = analysisResult.replyToPatient;
            const fallbackChart = `[최초 자동 해결된 경증 환자]\n증상: ${patientData.cc}\nNRS: ${patientData.nrs}`;
            followUpService.scheduleFollowUp(userId, fallbackChart, 15);
        } else {
            enqueueDoctorNotification(analysisResult.soapChartForDoctor, userId);
            followUpService.scheduleFollowUp(userId, analysisResult.soapChartForDoctor, 15);
            finalResponseText = analysisResult.replyToPatient +
                "\n\n🩺 작성해주신 차트를 담당 전문의 선생님들께 보고드렸습니다. 잠시만 대기해 주세요. (급박한 응급상황 시 119를 부르세요!)" +
                "\n\n🏥 '행복한 의사'는 의료 취약계층을 위한 비영리 단체입니다. 💛";
        }
        dbService.logConsultation(userId, patientData, analysisResult).catch(err => console.error("DB Log Error:", err));
        return { version: "2.0", template: { outputs: [{ simpleText: { text: finalResponseText } }] } };
    } catch (error) {
        console.error('[Sync Triage Error]', error);
        return { version: "2.0", template: { outputs: [{ simpleText: { text: "죄송합니다. 분석 중 오류가 발생했습니다. 다시 시도해주세요." } }] } };
    }
}

async function processTriageAsync(callbackUrl, userId, patientData) {
    try {
        const analysisResult = await analyzeAndRouteTriage(patientData);
        console.log('[Gemini Analysis Result]', analysisResult.action);

        let finalResponseText = '';

        if (analysisResult.action === 'AUTONOMOUS_REPLY') {
            finalResponseText = analysisResult.replyToPatient;
            const fallbackChart = `[최초 자동 해결된 경증 환자]\n증상: ${patientData.cc}\nNRS: ${patientData.nrs}`;
            followUpService.scheduleFollowUp(userId, fallbackChart, 15);
        } else {
            enqueueDoctorNotification(analysisResult.soapChartForDoctor, userId);
            followUpService.scheduleFollowUp(userId, analysisResult.soapChartForDoctor, 15);
            finalResponseText = analysisResult.replyToPatient + 
                "\n\n🩺 작성해주신 차트를 담당 전문의 선생님들께 보고드렸습니다. 진료 틈틈이 확인하시고 이곳으로 직접 답변을 드릴 예정이니 잠시만 대기해 주세요. (급박한 응급상황 시 지체 없이 119를 부르세요!)" +
                "\n\n🏥 '행복한 의사'는 의료 취약계층 환자분들을 위해 의사들이 자원봉사로 운영하는 비영리 단체입니다. 오늘 상담이 도움이 되셨다면, 이 활동이 계속될 수 있도록 작은 응원을 보내주세요. 💛";
        }

        dbService.logConsultation(userId, patientData, analysisResult).catch(err => console.error("DB Log Error:", err));

        // 콜백 URL로 실제 분석 결과 전송
        if (callbackUrl) {
            const callbackBody = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: { text: finalResponseText }
                    }]
                }
            };
            const response = await fetch(callbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(callbackBody)
            });
            console.log('[Callback Response]', response.status);
        } else {
            console.error('[Callback] No callbackUrl provided');
        }

    } catch (error) {
        console.error('[Async Triage Error]', error);
        if (callbackUrl) {
            await fetch(callbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: "2.0",
                    template: {
                        outputs: [{
                            simpleText: { text: "죄송합니다. 분석 중 오류가 발생했습니다. 다시 시도해주세요." }
                        }]
                    }
                })
            }).catch(e => console.error('[Callback Error]', e));
        }
    }
}

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

// 테스트용: F/U 타이머를 수동으로 즉시 실행 (프로덕션 배포 시 제거 또는 환경변수로 제한)
router.post('/test-trigger-fu', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    followUpService.executeFollowUpPush(userId);
    res.status(200).json({ ok: true, message: `F/U push triggered for ${userId}` });
});

module.exports = router;
