'use client'

import { useMemo, useState } from 'react'

import type { UiLanguage } from '@/lib/ui-language'

type ConsultationImageUploaderProps = {
  lookup: string
  uiLanguage: UiLanguage
  disabled?: boolean
  existingCount?: number
  onUploaded?: () => void
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

const copyByLanguage = {
  ko: {
    title: '사진 첨부',
    body:
      '상처, 발진, 복용 중인 약 포장처럼 사진이 있으면 상담에 도움이 됩니다.\n상담당 최대 3장, 장당 10MB 이하 사진을 올릴 수 있습니다.',
    disabled: '종료된 상담에는 사진을 추가할 수 없습니다.',
    full: '이 상담에는 이미 사진 3장이 등록되어 있습니다.',
    inputLabel: '사진 선택',
    uploadError: '사진을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    uploadSuccess: (count: number) => `사진 ${count}장을 저장했습니다.`,
    submitIdle: '사진 올리기',
    submitLoading: '사진을 저장하고 있습니다...',
  },
  en: {
    title: 'Add photos',
    body:
      'Photos such as a rash, wound, or medicine package can help the consultation.\nYou can upload up to 3 images, up to 10MB each.',
    disabled: 'Closed consultations cannot accept more photos.',
    full: 'This consultation already has the maximum 3 photos.',
    inputLabel: 'Choose photos',
    uploadError: 'We could not upload the photos right now. Please try again shortly.',
    uploadSuccess: (count: number) => `Saved ${count} photo${count === 1 ? '' : 's'}.`,
    submitIdle: 'Upload photos',
    submitLoading: 'Uploading photos...',
  },
} as const

export default function ConsultationImageUploader({
  lookup,
  uiLanguage,
  disabled = false,
  existingCount = 0,
  onUploaded,
}: ConsultationImageUploaderProps) {
  const copy = copyByLanguage[uiLanguage]
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const remainingSlots = Math.max(0, 3 - existingCount)
  const canUpload = !disabled && remainingSlots > 0

  const selectedSummary = useMemo(() => {
    return files.map((file) => `${file.name} (${formatFileSize(file.size)})`)
  }, [files])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!lookup || files.length === 0 || !canUpload) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('images', file))

      const response = await fetch(`/api/public/consultations/status/${encodeURIComponent(lookup)}/images`, {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json()) as { mediaItems?: Array<unknown> }
      if (!response.ok) {
        setError(copy.uploadError)
        return
      }

      setFiles([])
      setSuccess(copy.uploadSuccess(payload.mediaItems?.length || files.length))
      onUploaded?.()
    } catch {
      setError(copy.uploadError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
      <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
        {copy.title}
      </p>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">
        {copy.body}
      </p>

      {disabled ? (
        <div className="mt-4 rounded-[1.4rem] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
          {copy.disabled}
        </div>
      ) : remainingSlots === 0 ? (
        <div className="mt-4 rounded-[1.4rem] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
          {copy.full}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">
              {copy.inputLabel}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              disabled={submitting || !canUpload}
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files || []).slice(0, remainingSlots)
                setFiles(nextFiles)
                setError(null)
                setSuccess(null)
              }}
              className="mt-3 block w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--navy)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>

          {selectedSummary.length > 0 ? (
            <ul className="rounded-[1.4rem] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--ink)]">
              {selectedSummary.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : null}

          {error ? (
            <div className="rounded-[1.4rem] border border-[#ffd2c5] bg-[#fff6f2] px-4 py-4 text-sm leading-7 text-[#9b5031]">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-[1.4rem] border border-[#d4eadb] bg-[#f4fbf6] px-4 py-4 text-sm leading-7 text-[#2f6b45]">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || files.length === 0 || !canUpload}
            className="rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123c67] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? copy.submitLoading : copy.submitIdle}
          </button>
        </form>
      )}
    </div>
  )
}
