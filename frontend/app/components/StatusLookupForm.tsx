'use client'

import { useState } from 'react'

import { buildStatusPageHref, normalizeStatusLookup } from '@/lib/status'

type StatusLookupFormProps = {
  uiLanguage?: 'ko' | 'en'
}

export default function StatusLookupForm({ uiLanguage = 'ko' }: StatusLookupFormProps) {
  const [lookup, setLookup] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedLookup = normalizeStatusLookup(lookup)
    if (!normalizedLookup) {
      setError(uiLanguage === 'en' ? 'Please check the link or code again.' : '받은 링크나 코드를 다시 확인해 주세요.')
      return
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.happydoctor.kr'
    window.location.assign(buildStatusPageHref(normalizedLookup, uiLanguage, origin))
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
      <input
        type="text"
        value={lookup}
        onChange={(event) => {
          setLookup(event.target.value)
          setError(null)
        }}
        placeholder={uiLanguage === 'en' ? 'Status link or code' : '받은 링크 또는 코드'}
        className="w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
      />
      {error ? <p className="text-xs leading-6 text-[#9b5031]">{error}</p> : null}
      <button
        type="submit"
        className="rounded-[1.1rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white visited:text-white transition hover:bg-[#123c67]"
        style={{ color: '#ffffff' }}
      >
        {uiLanguage === 'en' ? 'Check status' : '상태 확인'}
      </button>
    </form>
  )
}
