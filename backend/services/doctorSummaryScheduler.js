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

module.exports = { scheduleDoctorSummary };
