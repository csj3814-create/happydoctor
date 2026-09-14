const dbService = require('./dbService');
const doctorSummaryService = require('./doctorSummaryService');

// Generates the clinician-facing summary after the patient has already been
// answered, and stores it on the consultation. Every caller is an intake path,
// so nothing here may fail a consultation: the summary is a convenience for the
// reviewing clinician, and losing it must never cost us the patient's request.
//
// Lives apart from doctorSummaryService so that module stays free of database
// dependencies, and apart from the routes so the web and KakaoTalk intakes
// cannot drift into having different behaviour.
function scheduleDoctorSummary(consultationId, patientData) {
  try {
    if (!consultationId || !doctorSummaryService.isEnabled()) return;

    setImmediate(() => {
      doctorSummaryService.generateSafely(patientData)
        .then((summary) => (summary ? dbService.saveAiDoctorSummary(consultationId, summary) : false))
        .catch((error) => {
          console.error('[Doctor Summary Error]', error?.message || error);
        });
    });
  } catch (error) {
    console.error('[Doctor Summary Schedule Error]', error?.message || error);
  }
}

// The clinician answering a follow-up needs a draft for the new question, not
// a second copy of the intake summary. Loading the consultation here keeps the
// route thin and means the draft sees the chart and the last reply as context.
function scheduleFollowUpDraft(consultationId, question) {
  try {
    // Whitespace is truthy, and a blank question would otherwise cost a
    // consultation read and a model call to produce nothing.
    const trimmedQuestion = String(question || '').trim();
    if (!consultationId || !trimmedQuestion || !doctorSummaryService.isEnabled()) return;

    setImmediate(() => {
      dbService.getConsultationById(consultationId)
        .then((consultation) => {
          if (!consultation) return false;

          const replies = Array.isArray(consultation.doctorReplies) ? consultation.doctorReplies : [];
          const priorReply = replies.length > 0 ? replies[replies.length - 1]?.message || '' : '';

          return doctorSummaryService.generateFollowUpSafely({
            patientData: consultation.translatedPatientDataKo || consultation.patientData || {},
            question: trimmedQuestion,
            priorReply,
          }).then((draft) => (draft ? dbService.saveAiFollowUpDraft(consultationId, draft) : false));
        })
        .catch((error) => {
          console.error('[Doctor Follow-Up Draft Error]', error?.message || error);
        });
    });
  } catch (error) {
    console.error('[Doctor Follow-Up Draft Schedule Error]', error?.message || error);
  }
}

module.exports = { scheduleDoctorSummary, scheduleFollowUpDraft };
