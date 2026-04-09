'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

export default function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [showFallbackHint, setShowFallbackHint] = useState(false)

  useEffect(() => {
    setIsStandalone(isStandaloneMode())

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent
      promptEvent.preventDefault()
      setInstallPrompt(promptEvent)
      setShowFallbackHint(false)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsStandalone(true)
      setShowFallbackHint(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) {
      setShowFallbackHint(true)
      return
    }

    setIsPromptOpen(true)

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice.outcome === 'accepted') {
        setIsStandalone(true)
        setShowFallbackHint(false)
      } else {
        setShowFallbackHint(true)
      }
    } finally {
      setInstallPrompt(null)
      setIsPromptOpen(false)
    }
  }

  if (isStandalone) {
    return (
      <div className="mt-6 rounded-[1.25rem] border border-[rgba(15,95,156,0.12)] bg-[rgba(15,95,156,0.06)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--blue)]">이미 홈 화면에 추가되어 있습니다.</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          지금처럼 앱처럼 열어서 상담 시작과 상태 확인을 바로 이어갈 수 있습니다.
        </p>
      </div>
    )
  }

  const helperText = installPrompt
    ? '이 브라우저에서는 설치 창이 열리면 바로 홈 화면에 추가할 수 있습니다.'
    : '설치 창이 자동으로 열리지 않는 브라우저라면 아래 안내대로 메뉴에서 홈 화면에 추가해 주세요.'

  return (
    <div className="mt-6 rounded-[1.35rem] border border-[rgba(15,95,156,0.12)] bg-white/72 p-4 shadow-[0_14px_26px_rgba(7,28,49,0.06)]">
      <button
        type="button"
        onClick={handleInstallClick}
        className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPromptOpen}
      >
        {isPromptOpen ? '설치 창 여는 중...' : 'PWA 설치하기'}
      </button>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{helperText}</p>
      {showFallbackHint ? (
        <p className="mt-2 text-xs leading-5 text-[var(--blue)]">
          Android Chrome은 메뉴의 홈 화면 추가, iPhone Safari는 공유 메뉴의 홈 화면에 추가를 사용하면 됩니다.
        </p>
      ) : null}
    </div>
  )
}
