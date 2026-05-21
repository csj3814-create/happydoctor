const { translateTexts } = require('./translationService');

const startUiCopyEn = {
  page: {
    eyebrow: 'Happy Doctor Start',
    title: 'Start a consultation on the web',
    description: 'Share only the essentials and we will open your consultation with a status link and lookup code.',
    homeLabel: 'English homepage',
    statusLabel: 'Check status',
    homeHref: 'https://happydoctor.kr/en',
    heroEyebrow: 'Care Access',
    heroTitle: 'A place to explain first\nwhen healthcare feels far away',
    heroBody: 'This page is an online medical support entry point for people who need to explain what is happening before they know where to ask for help.',
    infoTitle: 'Please tell us',
    infoItems: [
      'what feels most uncomfortable right now',
      'when it started',
      'whether you have chronic conditions or medicines',
    ],
    supportEyebrow: 'How this works',
    supportTitle: 'Tell us in your own language',
    supportItems: [
      'If your symptoms feel urgent, please use emergency services first.',
      'You can write in the language you selected for this page.',
      'We will try to translate your message for our doctors automatically.',
    ],
  },
  form: {
    recentEyebrow: 'Recent consultation',
    recentBody: 'Your most recent consultation stays available for one hour.\nYou can continue with code {code}.',
    recentLink: 'Continue recent consultation',
    restoredDraft: 'We restored the details you were typing so you can continue and submit the consultation.',
    languageHintEyebrow: 'Language support',
    languageHintTitle: 'You can write in {language}.',
    languageHintBody: 'We will try to detect {language} input automatically, translate it into Korean for our doctors, and send a translated reply back in the same language when possible.',
    phoneConsentRequired: 'Please enter a phone number if you want reply notifications.',
    phoneConsentMismatch: 'We only save a reply notification contact when you opt in.',
    submitError: 'We could not start the consultation right now. Please try again shortly.',
    ageLabel: 'Age or age range',
    agePlaceholder: 'Example: 40s, 27 years old',
    genderLabel: 'Gender',
    genderPlaceholder: 'Prefer not to say',
    genderOptions: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'other', label: 'Other' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
    chiefComplaintLabel: 'Main symptom',
    chiefComplaintPlaceholder: 'Example: stomach pain, cough, fever',
    onsetLabel: 'When did it start?',
    onsetPlaceholder: 'Example: this morning, 3 days ago',
    nrsLabel: 'Pain or symptom score',
    nrsUnknown: 'Not sure',
    symptomDetailLabel: 'Tell us more',
    symptomDetailPlaceholder: 'Please describe what feels uncomfortable and what worries you most right now.',
    associatedLabel: 'Other symptoms',
    associatedPlaceholder: 'Example: vomiting, fever, diarrhea, cough',
    historyLabel: 'Medical history or medicines',
    historyPlaceholder: 'Please tell us about chronic conditions or medicines you take.',
    imageLabel: 'Add photos',
    imageDescription: 'If you have photos such as a rash, wound, or medicine package, they can help us understand your situation better.\nYou can upload up to 3 images, up to 10MB each.',
    imageChooseLabel: 'Choose files',
    imageEmptyLabel: 'No file selected',
    imageSelectedLabel: '{count} files selected',
    notificationTitle: 'Leave a phone number for reply alerts',
    notificationDescription: 'Optional. We only use this contact if you opt in to receive a reply alert.',
    phoneLabel: 'Phone number',
    phonePlaceholder: 'Example: +82 10-1234-5678',
    policyNote: 'If this feels urgent, please use emergency services first. Happy Doctor does not replace emergency care. It is an online support service for people who need to ask for help before healthcare becomes harder to reach.',
    submitLoading: 'Bodeum is organizing your consultation...',
    submitIdle: 'Start consultation on the web',
    englishSupportNote: 'This page is translated for your selected language. Medical nuance may still require clarification in follow-up replies.',
  },
};

const copyCache = new Map();
const PLACEHOLDER_PATTERN = /\{[a-zA-Z0-9_]+\}/g;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectStringLeaves(value, path = [], leaves = []) {
  if (typeof value === 'string') {
    leaves.push({ path, value });
    return leaves;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringLeaves(item, [...path, index], leaves));
    return leaves;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) => {
      collectStringLeaves(nestedValue, [...path, key], leaves);
    });
  }

  return leaves;
}

function setValueAtPath(target, path, value) {
  let cursor = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = cursor[path[index]];
  }

  cursor[path[path.length - 1]] = value;
}

function maskPlaceholders(text) {
  const placeholders = [];
  const masked = text.replace(PLACEHOLDER_PATTERN, (match) => {
    const token = `__HDPH_${placeholders.length}__`;
    placeholders.push({ token, value: match });
    return token;
  });

  return { masked, placeholders };
}

function restorePlaceholders(text, placeholders) {
  return placeholders.reduce((current, placeholder) => {
    return current.replaceAll(placeholder.token, placeholder.value);
  }, text);
}

async function translateBundle(bundle, targetLanguage) {
  const clonedBundle = clone(bundle);
  const leaves = collectStringLeaves(clonedBundle);
  const maskedLeaves = leaves.map((leaf) => {
    const masked = maskPlaceholders(leaf.value);
    return {
      ...leaf,
      masked,
    };
  });

  const translatedValues = await translateTexts(
    maskedLeaves.map((leaf) => leaf.masked.masked),
    targetLanguage,
    { sourceLanguage: 'en' },
  );

  translatedValues.forEach((translatedValue, index) => {
    const leaf = maskedLeaves[index];
    setValueAtPath(
      clonedBundle,
      leaf.path,
      restorePlaceholders(translatedValue || leaf.value, leaf.masked.placeholders),
    );
  });

  return clonedBundle;
}

async function getLocalizedStartUiCopy(targetLanguage) {
  const normalizedTarget = typeof targetLanguage === 'string' ? targetLanguage.trim() : '';
  if (!normalizedTarget) {
    return clone(startUiCopyEn);
  }

  const cacheKey = normalizedTarget.toLowerCase();
  if (cacheKey === 'en') {
    return clone(startUiCopyEn);
  }

  if (copyCache.has(cacheKey)) {
    return clone(copyCache.get(cacheKey));
  }

  const translatedBundle = await translateBundle(startUiCopyEn, normalizedTarget);
  copyCache.set(cacheKey, translatedBundle);
  return clone(translatedBundle);
}

module.exports = {
  startUiCopyEn,
  getLocalizedStartUiCopy,
};
