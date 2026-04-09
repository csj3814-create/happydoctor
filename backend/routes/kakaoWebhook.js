const express = require('express');
const router = express.Router();
const { analyzeAndRouteTriage, analyzeFollowUp } = require('../services/llmService');
const {
    enqueueDoctorNotification,
    clearDoctorNotifications,
    clearPatientChannelPushes,
    clearPatientSmsNotifications,
} = require('../services/notifyService');
const followUpService = require('../services/followUpService');
const dbService = require('../services/dbService');
const { appSiteUrl, ConfigurationError, getMessengerApiKey } = require('../config');

function buildStatusLinkText(trackingInfo) {
    const trackingCode = trackingInfo?.trackingCode || '';
    const trackingToken = trackingInfo?.trackingToken || '';

    if (!trackingCode && !trackingToken) return '';

    const normalizedBaseUrl = appSiteUrl.replace(/\/$/, '');
    const queryKey = trackingCode ? 'code' : 'token';
    const queryValue = trackingCode || trackingToken;
    const statusUrl = `${normalizedBaseUrl}/status?${queryKey}=${encodeURIComponent(queryValue)}`;
    const directCodeLine = trackingCode ? `\n직접 입력 코드: ${trackingCode}` : '';

    return `\n\n앱에서 진행 상태 확인하기\n${statusUrl}${directCodeLine}`;
}

function collectKakaoImageUrls(value) {
    const collected = [];

    function visit(candidate) {
        if (!candidate) return;

        if (typeof candidate === 'string') {
            const normalized = candidate.trim();
            if (normalized) {
                collected.push(normalized);
            }
            return;
        }

        if (Array.isArray(candidate)) {
            candidate.forEach(visit);
            return;
        }

        if (typeof candidate === 'object') {
            visit(candidate.url);
            visit(candidate.value);
            visit(candidate.originalUrl);
            visit(candidate.imageUrl);
            visit(candidate.urls);
        }
    }

    visit(value);
    return [...new Set(collected)];
}

async function logConsultationAndGetStatusLink(userId, patientData, analysisResult) {
    try {
        const saved = await dbService.logConsultation(userId, patientData, analysisResult);
        const symptomImageUrls = collectKakaoImageUrls(patientData?.symptomImage);

        if (saved?.consultationId && symptomImageUrls.length > 0) {
            try {
                await dbService.addConsultationRemoteImagesById(saved.consultationId, symptomImageUrls, {
                    source: 'kakao_start',
                    originalName: 'kakao-symptom-image',
                });
            } catch (imageError) {
                console.error('[Kakao Consultation Image Save Error]', imageError);
            }
        }

        return buildStatusLinkText(saved);
    } catch (error) {
        console.error('[Status Link Logging Error]', error);
        return '';
    }
}

async function getLatestStatusLinkForUser(userId) {
    try {
        const latest = await dbService.getLatestConsultationTracking(userId);
        return buildStatusLinkText(latest);
    } catch (error) {
        console.error('[Status Link Lookup Error]', error);
        return '';
    }
}

async function getStatusLinkForConsultation(consultationId) {
    try {
        const consultation = await dbService.getConsultationTrackingById(consultationId);
        return buildStatusLinkText(consultation);
    } catch (error) {
        console.error('[Status Link Consultation Lookup Error]', error);
        return '';
    }
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getValidatedKakaoPayload(req, res) {
    if (!isPlainObject(req.body)) {
        res.status(200).json(
            createKakaoTextResponse(
                "요청을 다시 확인하지 못했어요. 아래 버튼으로 상담을 다시 시작해 주세요.",
                [START_CONSULTATION_QUICK_REPLY],
            ),
        );
        return null;
    }

    return req.body;
}

function getKakaoParams(payload) {
    return isPlainObject(payload?.action?.params) ? payload.action.params : {};
}

function getKakaoUserId(payload) {
    return payload?.userRequest?.user?.id || 'kakao_user_unknown';
}

function getKakaoCallbackUrl(payload) {
    const callbackUrl = payload?.userRequest?.callbackUrl;
    if (typeof callbackUrl !== 'string') return null;
    return /^https?:\/\//.test(callbackUrl) ? callbackUrl : null;
}

function getKakaoUtterance(payload) {
    return (payload?.userRequest?.utterance || '').toString().trim();
}

function getKakaoContexts(payload) {
    return Array.isArray(payload?.contexts) ? payload.contexts : [];
}

const START_CONSULTATION_QUICK_REPLY = { label: "상담 시작", action: "message", messageText: "예진상담" };
const END_CONSULTATION_QUICK_REPLY = { label: "상담 종료", action: "message", messageText: "상담종료" };

function createKakaoTextResponse(text, quickReplies = []) {
    const template = {
        outputs: [{ simpleText: { text } }]
    };

    if (quickReplies.length > 0) {
        template.quickReplies = quickReplies;
    }

    return {
        version: "2.0",
        template
    };
}

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

        const payload = getValidatedKakaoPayload(req, res);
        if (!payload) return;

        const params = getKakaoParams(payload);
        const userId = getKakaoUserId(payload);
        const callbackUrl = getKakaoCallbackUrl(payload);
        const utterance = getKakaoUtterance(payload);

        // 사용자가 "다음에 할게요" 등으로 중단하고 싶어할 때, 예진을 시작하지 않고 종료 메시지 반환
        const cancelPhrases = ['다음에', '나중에', '그만', '중단', '끝낼게', '종료'];
        const normalized = utterance.replace(/\s+/g, '');
        if (cancelPhrases.some(kw => normalized.includes(kw))) {
            return res.status(200).json(
                createKakaoTextResponse(
                    "알겠습니다. 지금은 여기서 멈출게요.\n필요하실 때 다시 찾아주시면 보듬이와 의료진이 함께 도와드릴게요.",
                    [START_CONSULTATION_QUICK_REPLY],
                ),
            );
        }

        // 컨텍스트에서 파라미터 추출
        const contextParams = {};
        const contexts = getKakaoContexts(payload);
        for (const ctx of contexts) {
            if (ctx.params) {
                for (const [key, val] of Object.entries(ctx.params)) {
                    if (val && val.value) contextParams[key] = val.value;
                }
            }
        }

        const merged = { ...contextParams, ...params };
        console.log('[Merged Params]', JSON.stringify(merged));

        // confirm 파라미터 처리: "다시" → 세션 초기화 후 재시작 안내, "종료" → 상담 종료
        const confirm = (merged.confirm || '').toString().trim();
        if (confirm === '다시') {
            await followUpService.resetSession(userId);
            return res.status(200).json(
                createKakaoTextResponse(
                    "좋습니다. 처음부터 다시 도와드릴게요.\n아래 버튼으로 상담을 다시 시작해 주세요.",
                    [START_CONSULTATION_QUICK_REPLY],
                ),
            );
        }
        if (confirm === '종료') {
            await followUpService.resetSession(userId);
            return res.status(200).json(
                createKakaoTextResponse(
                    "알겠습니다.\n오늘 상담은 여기서 마칠게요.\n필요하실 때 다시 찾아주세요.",
                    [START_CONSULTATION_QUICK_REPLY],
                ),
            );
        }

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
            symptomImage: merged.symptom_image || merged.image_url || null
        };

        // 슬롯필링이 완료되지 않은 premature 호출 감지
        // (예: "예진시작" 블록이 실수로 스킬을 호출한 경우, chief_complaint 파라미터가 없음)
        const rawCc = merged.chief_complaint;
        if (!rawCc || rawCc.startsWith('sys.')) {
            console.warn(`[Premature Call] ${userId} — chief_complaint 없음. 슬롯필링 미완료로 판단, Gemini 호출 없이 즉시 반환.`);
            return res.status(200).json({
                version: "2.0",
                template: {
                    outputs: [{ simpleText: { text: "상담 정보를 아직 다 받지 못했어요.\n아래 버튼으로 다시 시작해 주세요." } }],
                    quickReplies: [
                        START_CONSULTATION_QUICK_REPLY
                    ]
                }
            });
        }

        // 대기 중인 F/U 질문이 있으면 새 상담 대신 F/U 질문을 먼저 표시
        // ※ resetSession() 호출 전에 체크해야 pending 플래그가 살아있음
        const pendingFU = await followUpService.consumePendingFollowUp(userId);
        if (pendingFU) {
            console.log(`[F/U Pending] ${userId} — 대기 중인 F/U 질문 전달`);
            return res.status(200).json(
                createKakaoTextResponse(`보듬이가 경과를 한 번 더 확인드릴게요.\n\n${pendingFU}`),
            );
        }

        // 새로운 상담 시작: 이전 상담 상태(타이머 등) 초기화
        // ※ consumePendingFollowUp() 이후에 호출해야 pending 플래그가 유지됨
        await followUpService.resetSession(userId);

        if (callbackUrl) {
            // 콜백 모드: 대기 메시지 먼저 반환 후 비동기 처리
            res.status(200).json({
                version: "2.0",
                useCallback: true,
                template: {
                    outputs: [{
                        simpleText: { text: "보듬이가 상담 내용을 정리하고 있어요.\n잠시만 기다려 주세요..." }
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
            ...createKakaoTextResponse("죄송합니다. 상담 내용을 처리하는 중 문제가 생겼습니다.\n잠시 후 다시 시도해 주세요."),
        });
    }
});

// 콜백 모드(useCallback)가 꺼진 경우의 안전망: 4.5초 내 응답 못하면 재시도 안내 반환
const SYNC_TIMEOUT_MS = 4500;

async function processTriageSync(userId, patientData) {
    try {
        const startTime = Date.now();

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SYNC_TIMEOUT')), SYNC_TIMEOUT_MS)
        );

        let analysisResult;
        try {
            analysisResult = await Promise.race([
                analyzeAndRouteTriage(patientData),
                timeoutPromise
            ]);
        } catch (raceErr) {
            if (raceErr.message === 'SYNC_TIMEOUT') {
                console.warn(`[Sync Timeout] ${userId} — Gemini가 ${SYNC_TIMEOUT_MS}ms 내 응답 못함. 재시도 안내 반환. (콜백 모드 ON 권장)`);
                return {
                    version: "2.0",
                    template: {
                        outputs: [{ simpleText: { text: "답변 준비에 시간이 조금 더 필요합니다.\n아래 버튼으로 다시 시도해 주세요.\n계속 지연되면 잠시 후 다시 찾아주세요." } }],
                        quickReplies: [
                            START_CONSULTATION_QUICK_REPLY
                        ]
                    }
                };
            }
            throw raceErr;
        }

        const durationMs = Date.now() - startTime;
        console.log(`[Timing] analyzeAndRouteTriage took ${durationMs}ms`);

        let finalResponseText = '';
        if (analysisResult.action === 'AUTONOMOUS_REPLY') {
            finalResponseText = analysisResult.replyToPatient;
            const fallbackChart = `[최초 자동 해결된 경증 환자]\n증상: ${patientData.cc}\n증상점수: ${patientData.nrs}`;
            await followUpService.scheduleFollowUpWithOptions(userId, fallbackChart, 15, {
                reminderDelaysMinutes: [15, 180, 1440],
            });
        } else {
            await enqueueDoctorNotification(analysisResult.soapChartForDoctor, userId, {
                type: 'triage_initial',
                priority: 'urgent',
                reminderDelaysMinutes: [0, 5, 15],
            });
            await followUpService.scheduleFollowUpWithOptions(userId, analysisResult.soapChartForDoctor, 15, {
                reminderDelaysMinutes: [15, 180, 1440],
            });
            finalResponseText = analysisResult.replyToPatient +
                "\n\n보듬이가 내용을 정리해 자원봉사 의료진에게 전달했습니다.\n답변이 준비되면 이 채널로 다시 안내드릴게요.\n증상이 많이 힘들어지면 지체 없이 119 또는 가까운 응급실을 이용해 주세요.";
        }
        finalResponseText += await logConsultationAndGetStatusLink(userId, patientData, analysisResult);
        return {
            version: "2.0",
            template: {
                outputs: [{ simpleText: { text: finalResponseText } }],
                quickReplies: [
                    START_CONSULTATION_QUICK_REPLY,
                    END_CONSULTATION_QUICK_REPLY
                ]
            }
        };
    } catch (error) {
        console.error('[Sync Triage Error]', error);
        return createKakaoTextResponse(
            "죄송합니다. 상담 내용을 정리하는 중 문제가 생겼습니다.\n잠시 후 다시 시도해 주세요.",
            [START_CONSULTATION_QUICK_REPLY],
        );
    }
}

async function processTriageAsync(callbackUrl, userId, patientData) {
    try {
        const startTime = Date.now();
        const analysisResult = await analyzeAndRouteTriage(patientData);
        const durationMs = Date.now() - startTime;
        console.log(`[Timing] analyzeAndRouteTriage (async) took ${durationMs}ms`);
        console.log('[Gemini Analysis Result]', analysisResult.action);

        let finalResponseText = '';

        if (analysisResult.action === 'AUTONOMOUS_REPLY') {
            finalResponseText = analysisResult.replyToPatient;
            const fallbackChart = `[최초 자동 해결된 경증 환자]\n증상: ${patientData.cc}\n증상점수: ${patientData.nrs}`;
            await followUpService.scheduleFollowUpWithOptions(userId, fallbackChart, 15, {
                reminderDelaysMinutes: [15, 180, 1440],
            });
        } else {
            await enqueueDoctorNotification(analysisResult.soapChartForDoctor, userId, {
                type: 'triage_initial',
                priority: 'urgent',
                reminderDelaysMinutes: [0, 5, 15],
            });
            await followUpService.scheduleFollowUpWithOptions(userId, analysisResult.soapChartForDoctor, 15, {
                reminderDelaysMinutes: [15, 180, 1440],
            });
            finalResponseText = analysisResult.replyToPatient +
                "\n\n보듬이가 내용을 정리해 자원봉사 의료진에게 전달했습니다.\n답변이 준비되면 이 채널로 다시 안내드릴게요.\n증상이 많이 힘들어지면 지체 없이 119 또는 가까운 응급실을 이용해 주세요.";
        }

        finalResponseText += await logConsultationAndGetStatusLink(userId, patientData, analysisResult);

        // 콜백 URL로 실제 분석 결과 전송
        if (callbackUrl) {
            const callbackBody = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: { text: finalResponseText }
                    }],
                    quickReplies: [
                        START_CONSULTATION_QUICK_REPLY,
                        END_CONSULTATION_QUICK_REPLY
                    ]
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
                            simpleText: { text: "죄송합니다. 상담 내용을 정리하는 중 문제가 생겼습니다.\n잠시 후 다시 시도해 주세요." }
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

        const payload = getValidatedKakaoPayload(req, res);
        if (!payload) return;

        const params = getKakaoParams(payload);
        const userId = getKakaoUserId(payload);

        const nrsChange = params.nrs || '응답 없음';
        const additionalSymptom = params.additional_symptom || '특이사항 없음';

        // 1. 기존 차트 가져오기
        const originalChart = await followUpService.getOriginalChart(userId);

        // 세션 만료 또는 기록 없는 경우 — Gemini 호출 없이 안내 메시지 반환
        if (!originalChart || originalChart === '이전 차트 기록 없음') {
            console.warn(`[F/U Reply] ${userId} — 이전 차트 없음 또는 세션 만료. F/U 분석 생략.`);
            return res.status(200).json(
                createKakaoTextResponse(
                    "이전 상담 흐름이 만료되었습니다.\n증상이 계속되면 아래 버튼으로 새 상담을 시작해 주세요.",
                    [START_CONSULTATION_QUICK_REPLY],
                ),
            );
        }

        // 2. 증상 변화 AI 분석 (호전/유지 vs 악화)
        const fuAnalysis = await analyzeFollowUp(originalChart, nrsChange, additionalSymptom);
        console.log('[Gemini F/U Analysis Result]', fuAnalysis.action);

        let finalResponseText = fuAnalysis.replyToPatient;

        // 3. 악화 시 전문의 큐 재할당
        if (fuAnalysis.action === 'ESCALATE_FU') {
            await enqueueDoctorNotification(`🚨 **[F/U 경고: 증상 악화 감지]**\n${fuAnalysis.fuChartForDoctor}`, userId, {
                type: 'follow_up_doctor',
                priority: 'urgent',
                reminderDelaysMinutes: [0, 5, 15],
            });
            finalResponseText += "\n\n증상 변화를 의료진이 한 번 더 확인할 수 있도록 바로 전달했습니다.\n답변을 준비하는 동안 잠시만 기다려 주세요.\n많이 힘드시면 119 또는 가까운 응급실을 이용해 주세요.";
        }

        // [추가] 4. F/U 내역에 대한 상태 점검 기록을 추후 홈페이지 조회를 위해 DB에 병합
        dbService.logFollowUp(userId, fuAnalysis).catch(err => console.error("DB F/U Log Error:", err));
        finalResponseText += await getLatestStatusLinkForUser(userId);

        return res.status(200).json({
            version: "2.0",
            template: {
                outputs: [{ simpleText: { text: finalResponseText } }],
                quickReplies: [
                    START_CONSULTATION_QUICK_REPLY,
                    END_CONSULTATION_QUICK_REPLY
                ]
            }
        });

    } catch (error) {
        console.error('[Kakao F/U Webhook Error]', error);
        return res.status(500).json({
            ...createKakaoTextResponse(
                "경과를 확인하는 중 일시적인 문제가 생겼습니다.\n잠시 후 다시 시도해 주세요.",
                [START_CONSULTATION_QUICK_REPLY],
            ),
        });
    }
});

/**
 * 예진 중단 엔드포인트
 * 슬롯 필링 도중 "그만", "중단" 등 취소 의도 발화 시 오픈빌더에서 호출합니다.
 * - F/U 타이머 및 세션 초기화
 * - 따뜻한 중단 안내 메시지 반환
 */
router.post('/cancel-triage', async (req, res) => {
    const payload = getValidatedKakaoPayload(req, res);
    if (!payload) return;

    const userId = getKakaoUserId(payload);
    console.log(`[Cancel Triage] ${userId} — 예진 도중 중단 요청`);

    await followUpService.resetSession(userId);

    return res.status(200).json({
        ...createKakaoTextResponse(
            "알겠습니다. 지금은 여기서 멈출게요.\n필요하실 때 다시 찾아주시면 보듬이와 의료진이 함께 도와드릴게요.",
            [START_CONSULTATION_QUICK_REPLY],
        ),
    });
});

// 테스트용: F/U 타이머를 수동으로 즉시 실행 (개발/테스트 환경에서만 사용)
router.post('/test-trigger-fu', async (req, res) => {
    // MESSENGER_API_KEY로 인증 — 설정되지 않으면 항상 거부
    const apiKey = req.headers['x-api-key'];
    let validKey = '';

    try {
        validKey = getMessengerApiKey();
    } catch (error) {
        if (error instanceof ConfigurationError) {
            return res.status(503).json({ error: 'Service not configured' });
        }

        throw error;
    }

    if (apiKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isPlainObject(req.body)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const userId = typeof req.body.userId === 'string' ? req.body.userId.trim() : '';
    if (!userId) return res.status(400).json({ error: 'userId required' });

    await followUpService.executeFollowUpPush(userId);
    res.status(200).json({ ok: true, message: `F/U push triggered for ${userId}` });
});

/**
 * 상담 종결 엔드포인트
 * 환자가 "상담종료" 버튼을 눌러 종결 사유를 선택하면 호출됩니다.
 * - F/U 타이머 취소
 * - DB 상태 업데이트 (COMPLETED)
 * - 따뜻한 종결 메시지 반환
 */
router.post('/close-consultation', async (req, res) => {
    try {
        const payload = getValidatedKakaoPayload(req, res);
        if (!payload) return;

        const params = getKakaoParams(payload);
        const userId = getKakaoUserId(payload);
        const reason = (params.close_reason || '환자 종결').toString().trim();

        console.log(`[Close Consultation] ${userId}, reason: ${reason}`);

        // 1) F/U 타이머 및 대기 데이터 삭제
        await followUpService.cancelFollowUp(userId);
        await clearDoctorNotifications(userId);
        await clearPatientChannelPushes(userId, 'doctor_reply');
        await clearPatientSmsNotifications(userId, 'doctor_reply');

        // 2) DB 상태 업데이트
        dbService.closeConsultation(userId, reason).catch(err => console.error('DB Close Error:', err));

        // 3) 종결 메시지
        const closeMessages = {
            '증상 호전': '다행히 증상이 나아지고 있군요.\n불편이 다시 생기면 언제든 다시 찾아주세요.',
            '응급실 방문': '응급실에서 필요한 진료를 잘 받으셨길 바랍니다.\n이후에 궁금한 점이 생기면 다시 말씀해 주세요.',
            '외래 진료': '외래 진료로 이어지게 되어 다행입니다.\n진료 전후로 궁금한 점이 생기면 다시 찾아주세요.',
            '단순 취소': '알겠습니다.\n필요하실 때 언제든 다시 찾아주세요.',
        };
        const personalMsg = closeMessages[reason] || '오늘 상담은 여기서 마무리할게요.\n필요하실 때 언제든 다시 찾아주세요.';

        const statusLinkText = await getLatestStatusLinkForUser(userId);
        const finalText = `보듬입니다.\n${personalMsg}\n\n해피닥터는 의료 접근성 취약계층을 위한 무료 온라인 의료상담입니다.\n필요하실 때 다시 이어서 도와드릴게요.${statusLinkText}`;

        return res.status(200).json({
            version: "2.0",
            template: {
                outputs: [{ simpleText: { text: finalText } }],
                quickReplies: [
                    START_CONSULTATION_QUICK_REPLY
                ]
            }
        });
    } catch (error) {
        console.error('[Close Consultation Error]', error);
        return res.status(500).json({
            ...createKakaoTextResponse(
                "상담을 마무리하는 중 일시적인 문제가 생겼습니다.\n잠시 후 다시 시도해 주세요.",
                [START_CONSULTATION_QUICK_REPLY],
            ),
        });
    }
});

/**
 * POST /kakao/check-doctor-reply
 * 환자가 채널에 접속하거나 메시지를 보낼 때 대기 중인 의사 답변을 확인합니다.
 * 카카오 오픈빌더 폴백 블록 또는 "처음으로" 블록에 연결하세요.
 */
router.post('/check-doctor-reply', async (req, res) => {
    try {
        const payload = getValidatedKakaoPayload(req, res);
        if (!payload) return;

        const userId = getKakaoUserId(payload);
        const pending = await dbService.getPendingDoctorReply(userId);

        if (pending) {
            await dbService.markReplyAsSeen(pending.id);
            try {
                await clearPatientChannelPushes(userId, 'doctor_reply');
            } catch (clearError) {
                console.warn(`[Kakao Check Doctor Reply] Failed to clear reply reminders for ${userId}:`, clearError.message);
            }
            try {
                await clearPatientSmsNotifications(userId, 'doctor_reply');
            } catch (clearError) {
                console.warn(`[Kakao Check Doctor Reply] Failed to clear SMS reply reminders for ${userId}:`, clearError.message);
            }
            if (pending.doctorEmail) {
                await dbService.awardHDT(pending.doctorEmail, pending.doctorName, dbService.HDT_SEEN, 'seen');
            }
            const statusLinkText = await getStatusLinkForConsultation(pending.consultationId);
            const replyText =
                `의료진 답변이 도착했습니다.\n\n` +
                `👨‍⚕️ ${pending.doctorName}\n\n` +
                `${pending.message}${statusLinkText}\n\n` +
                `도움이 충분했다면 이 채널에 상담종료라고 보내 상담을 마무리해 주세요.`;

            return res.status(200).json({
                version: "2.0",
                template: {
                    outputs: [{ simpleText: { text: replyText } }],
                    quickReplies: [
                        START_CONSULTATION_QUICK_REPLY,
                        END_CONSULTATION_QUICK_REPLY
                    ]
                }
            });
        }

        // 대기 중인 답변 없음 → 일반 환영 메시지
        const statusLinkText = await getLatestStatusLinkForUser(userId);
        return res.status(200).json({
            ...createKakaoTextResponse(
                `안녕하세요. 해피닥터 보듬입니다.\n의료가 멀게 느껴질 때 먼저 말씀해 주세요.${statusLinkText}`,
                [START_CONSULTATION_QUICK_REPLY],
            ),
        });
    } catch (error) {
        console.error('[CheckDoctorReply Error]', error);
        return res.status(200).json({
            ...createKakaoTextResponse(
                "답변을 확인하는 중 잠시 문제가 생겼습니다.\n조금 뒤 다시 시도해 주세요.",
                [START_CONSULTATION_QUICK_REPLY],
            ),
        });
    }
});

module.exports = router;
