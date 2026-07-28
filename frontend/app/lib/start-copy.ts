import { localizedStartCopyByInputLanguage } from './start-copy-localized'

const BACKEND_URL = process.env.HAPPYDOCTOR_BACKEND_URL || 'https://happydoctor.onrender.com'

export type StartPageCopy = {
  eyebrow: string
  title: string
  description: string
  homeLabel: string
  statusLabel: string
  homeHref: string
  heroEyebrow: string
  heroTitle: string
  heroBody: string
  infoTitle: string
  infoItems: string[]
  supportEyebrow: string
  supportTitle: string
  supportItems: string[]
}

export type StartFormCopy = {
  recentEyebrow: string
  recentBody: string
  recentLink: string
  restoredDraft: string
  languageHintEyebrow: string
  languageHintTitle: string
  languageHintBody: string
  phoneConsentRequired: string
  phoneConsentMismatch: string
  submitError: string
  ageLabel: string
  agePlaceholder: string
  genderLabel: string
  genderPlaceholder: string
  genderOptions: Array<{ value: string; label: string }>
  chiefComplaintLabel: string
  chiefComplaintPlaceholder: string
  onsetLabel: string
  onsetPlaceholder: string
  nrsLabel: string
  nrsUnknown: string
  symptomDetailLabel: string
  symptomDetailPlaceholder: string
  associatedLabel: string
  associatedPlaceholder: string
  historyLabel: string
  historyPlaceholder: string
  imageLabel: string
  imageDescription: string
  imageChooseLabel: string
  imageEmptyLabel: string
  imageSelectedLabel: string
  notificationTitle: string
  notificationDescription: string
  phoneLabel: string
  phonePlaceholder: string
  policyNote: string
  submitLoading: string
  submitIdle: string
  englishSupportNote: string
}

export type LocalizedStartCopyBundle = {
  page: StartPageCopy
  form: StartFormCopy
}

export const startCopyByLanguage: Record<'ko' | 'en', LocalizedStartCopyBundle> = {
  ko: {
    page: {
      eyebrow: 'Happy Doctor Start',
      title: '웹에서 바로 상담 시작',
      description: '필요한 정보만 적어 주시면 상담을 접수하고 상태 확인 코드도 함께 드립니다.',
      homeLabel: '홈페이지 보기',
      statusLabel: '상태 확인',
      homeHref: 'https://happydoctor.kr/ko',
      heroEyebrow: 'Care Access',
      heroTitle: '의료가 멀게 느껴질 때\n먼저 설명할 수 있는 곳',
      heroBody: '이 화면은 어디서부터 도움을 구해야 할지 막막한 순간에 먼저 설명하고 연결되는 온라인 의료상담 창구입니다.',
      infoTitle: '이런 내용을 적어 주세요',
      infoItems: [
        '가장 불편한 증상',
        '언제부터 시작됐는지',
        '기저질환이나 복용 중인 약이 있는지',
      ],
      supportEyebrow: '진행 방식',
      supportTitle: '천천히 적어도 괜찮습니다',
      supportItems: [
        '증상이 급하면 119나 가까운 응급실이 우선입니다.',
        '화면은 한국어 중심이지만 영어 입력도 가능합니다.',
        '영어 외 다른 언어도 입력할 수 있으며, 번역이 필요한 경우에도 의료진이 직접 상담을 검토합니다.',
      ],
    },
    form: {
      recentEyebrow: '최근 상담',
      recentBody: '최근 시작한 상담은 1시간 동안 유지됩니다.\n코드 {code} 로 바로 이어서 확인할 수 있습니다.',
      recentLink: '최근 상담 이어보기',
      restoredDraft: '방금 입력하던 내용을 다시 불러왔습니다. 이어서 작성한 뒤 상담을 시작할 수 있습니다.',
      languageHintEyebrow: '언어 안내',
      languageHintTitle: '{language} 로 적어도 괜찮습니다.',
      languageHintBody: '{language} 로 입력한 내용은 의료진 검토를 돕기 위해 번역될 수 있으며, 모든 상담과 답변은 의료진이 직접 검토합니다.',
      phoneConsentRequired: '답변 알림을 받으려면 휴대폰 번호를 입력해 주세요.',
      phoneConsentMismatch: '답변 알림 연락처는 동의한 경우에만 저장할 수 있습니다.',
      submitError: '상담을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      ageLabel: '나이 또는 연령대',
      agePlaceholder: '예: 40대, 27세',
      genderLabel: '성별',
      genderPlaceholder: '선택 안 함',
      genderOptions: [
        { value: 'female', label: '여성' },
        { value: 'male', label: '남성' },
        { value: 'other', label: '기타' },
        { value: 'prefer_not_to_say', label: '밝히지 않음' },
      ],
      chiefComplaintLabel: '가장 불편한 증상',
      chiefComplaintPlaceholder: '예: 복통, 기침, 발열',
      onsetLabel: '언제부터 있었나요',
      onsetPlaceholder: '예: 오늘 아침부터, 3일 전부터',
      nrsLabel: '증상 점수',
      nrsUnknown: '모르겠음',
      symptomDetailLabel: '자세한 설명',
      symptomDetailPlaceholder: '어디가 어떻게 불편한지, 지금 가장 걱정되는 점이 무엇인지 적어 주세요.',
      associatedLabel: '함께 있는 증상',
      associatedPlaceholder: '예: 구토, 발열, 설사, 기침',
      historyLabel: '기저질환 또는 복용약',
      historyPlaceholder: '앓고 있는 질환, 복용 중인 약이 있으면 적어 주세요.',
      imageLabel: '사진 첨부',
      imageDescription: '상처, 발진, 복용 중인 약 포장처럼 사진이 있으면 처음 상담을 더 정확하게 이어갈 수 있습니다.\n최대 3장, 장당 10MB 이하 사진을 올릴 수 있습니다.',
      imageChooseLabel: '파일 선택',
      imageEmptyLabel: '선택된 파일 없음',
      imageSelectedLabel: '{count}개 파일 선택됨',
      notificationTitle: '의료진 답변 알림 연락처 남기기',
      notificationDescription: '선택 사항입니다. 동의한 경우에만 의료진 답변 알림 연락처로 사용됩니다.',
      phoneLabel: '휴대폰 번호',
      phonePlaceholder: '예: 010-1234-5678',
      policyNote: '응급 상황이라고 느껴지면 신고나 119 또는 가까운 응급실 이용이 우선입니다. 해피닥터는 응급실을 대신하는 서비스가 아니라 의료가 멀게 느껴지는 분들이 온라인으로 먼저 도움을 청할 수 있게 돕는 상담 서비스입니다.',
      submitLoading: '상담 내용을 안전하게 접수하고 있습니다...',
      submitIdle: '웹으로 상담 시작',
      englishSupportNote: '한국어와 영어 UI를 지원합니다. 번역이 필요한 경우에도 모든 상담은 의료진이 직접 검토합니다.',
    },
  },
  en: {
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
        'Your message may be translated to support review, and every consultation is directly reviewed by a doctor.',
      ],
    },
    form: {
      recentEyebrow: 'Recent consultation',
      recentBody: 'Your most recent consultation stays available for one hour.\nYou can continue with code {code}.',
      recentLink: 'Continue recent consultation',
      restoredDraft: 'We restored the details you were typing so you can continue and submit the consultation.',
      languageHintEyebrow: 'Language support',
      languageHintTitle: 'You can write in {language}.',
      languageHintBody: 'Your {language} message may be translated to support review. Every consultation and reply is directly reviewed by a doctor.',
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
      submitLoading: 'Submitting your consultation securely...',
      submitIdle: 'Start consultation on the web',
      englishSupportNote: 'This page is translated for your selected language. Medical nuance may still require clarification in follow-up replies.',
    },
  },
}

function cloneCopyBundle(bundle: LocalizedStartCopyBundle): LocalizedStartCopyBundle {
  return JSON.parse(JSON.stringify(bundle)) as LocalizedStartCopyBundle
}

function normalizeLocalizedCopyLanguage(value: string) {
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'zh-cn') return 'zh-cn'
  if (trimmed === 'zh-tw') return 'zh-tw'
  return trimmed
}

export function getBuiltInLocalizedStartCopy(targetLanguage: string): LocalizedStartCopyBundle | null {
  const normalizedLanguage = normalizeLocalizedCopyLanguage(targetLanguage)
  const bundle = localizedStartCopyByInputLanguage[normalizedLanguage]
  return bundle ? cloneCopyBundle(bundle) : null
}

export async function fetchLocalizedStartCopy(targetLanguage: string): Promise<LocalizedStartCopyBundle | null> {
  const trimmed = targetLanguage.trim()
  if (!trimmed) return null

  const builtInCopy = getBuiltInLocalizedStartCopy(trimmed)
  if (builtInCopy) {
    return builtInCopy
  }

  try {
    const response = await fetch(
      `${BACKEND_URL.replace(/\/$/, '')}/api/public/ui-copy/start?lang=${encodeURIComponent(trimmed)}`,
      {
        cache: 'force-cache',
        next: { revalidate: 60 * 60 * 24 },
      },
    )

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as { copy?: LocalizedStartCopyBundle }
    return payload.copy ? cloneCopyBundle(payload.copy) : null
  } catch {
    return null
  }
}
