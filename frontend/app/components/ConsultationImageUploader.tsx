'use client'

import { useMemo, useState } from 'react'

type ConsultationImageUploaderProps = {
  lookup: string
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

export default function ConsultationImageUploader({
  lookup,
  disabled = false,
  existingCount = 0,
  onUploaded,
}: ConsultationImageUploaderProps) {
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

      const payload = (await response.json()) as { error?: string; mediaItems?: Array<unknown> }
      if (!response.ok) {
        setError(payload.error || '사진을 업로드하지 못했습니다.')
        return
      }

      setFiles([])
      setSuccess(`사진 ${payload.mediaItems?.length || files.length}장을 저장했습니다.`)
      onUploaded?.()
    } catch {
      setError('사진을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[1.8rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
      <p className="display-face text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue)]">
        사진 첨부
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        상처, 피부, 복용 중인 약 포장처럼 사진이 있으면 상담에 도움이 됩니다.
        <br />
        상담당 최대 3장, 장당 10MB 이하 사진을 올릴 수 있습니다.
      </p>

      {disabled ? (
        <div className="mt-4 rounded-[1.4rem] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
          종료된 상담에는 사진을 추가할 수 없습니다.
        </div>
      ) : remainingSlots === 0 ? (
        <div className="mt-4 rounded-[1.4rem] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
          이 상담에는 이미 사진 3장이 등록되어 있습니다.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--ink)]">
              사진 선택
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
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
            {submitting ? '사진을 저장하고 있습니다...' : '사진 올리기'}
          </button>
        </form>
      )}
    </div>
  )
}
