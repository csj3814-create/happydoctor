'use client'

import { useState } from 'react'

import { isStatusCode, normalizeStatusLookup } from '@/lib/status'

type DeletionReceipt = {
  requestId: string
  receiptToken: string
  status: string
}

type DeletionStatus = {
  requestId?: string
  status?: string
  requestedAt?: string | null
  completedAt?: string | null
  rejectedReason?: string | null
}

const statusLabels: Record<string, string> = {
  pending: '접수됨',
  processing: '삭제 처리 중',
  completed: '삭제 완료',
  rejected: '처리 불가',
  failed: '재처리 필요',
}

async function readJsonResponse(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>
}

export default function DataDeletionRequestForm() {
  const [lookup, setLookup] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<DeletionReceipt | null>(null)
  const [copied, setCopied] = useState(false)

  const [requestId, setRequestId] = useState('')
  const [receiptToken, setReceiptToken] = useState('')
  const [checking, setChecking] = useState(false)
  const [statusResult, setStatusResult] = useState<DeletionStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  async function submitDeletionRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setReceipt(null)

    const normalizedLookup = normalizeStatusLookup(lookup)
    if (!normalizedLookup || isStatusCode(normalizedLookup)) {
      setError('6자리 코드가 아닌, 상담 접수 시 받은 전체 상태 링크 또는 장기 토큰을 입력해 주세요.')
      return
    }
    if (!confirmed) {
      setError('삭제 후 복구할 수 없다는 내용을 확인해 주세요.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/public/data-deletion-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup: normalizedLookup, confirmed: true }),
      })
      const payload = await readJsonResponse(response)

      if (!response.ok) {
        setError(typeof payload.error === 'string' ? payload.error : '삭제 요청을 접수하지 못했습니다.')
        return
      }

      if (typeof payload.requestId !== 'string' || typeof payload.receiptToken !== 'string') {
        setError('삭제 요청은 접수되었지만 영수증 정보를 확인하지 못했습니다. 운영자에게 문의해 주세요.')
        return
      }

      const nextReceipt = {
        requestId: payload.requestId,
        receiptToken: payload.receiptToken,
        status: typeof payload.status === 'string' ? payload.status : 'pending',
      }
      setReceipt(nextReceipt)
      setRequestId(nextReceipt.requestId)
      setReceiptToken(nextReceipt.receiptToken)
      setLookup('')
      setConfirmed(false)
    } catch {
      setError('삭제 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyReceipt() {
    if (!receipt || !navigator.clipboard) return
    await navigator.clipboard.writeText(
      `삭제 요청 번호: ${receipt.requestId}\n영수증 토큰: ${receipt.receiptToken}`,
    )
    setCopied(true)
  }

  async function checkDeletionStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusError(null)
    setStatusResult(null)

    const normalizedRequestId = requestId.trim()
    const normalizedReceiptToken = receiptToken.trim()
    if (!normalizedRequestId || !normalizedReceiptToken) {
      setStatusError('삭제 요청 번호와 영수증 토큰을 모두 입력해 주세요.')
      return
    }

    setChecking(true)
    try {
      const response = await fetch(
        `/api/public/data-deletion-requests/${encodeURIComponent(normalizedRequestId)}`,
        {
          headers: { 'X-Deletion-Receipt-Token': normalizedReceiptToken },
          cache: 'no-store',
        },
      )
      const payload = await readJsonResponse(response)
      if (!response.ok) {
        setStatusError(typeof payload.error === 'string' ? payload.error : '삭제 요청 상태를 확인하지 못했습니다.')
        return
      }

      setStatusResult({
        requestId: typeof payload.requestId === 'string' ? payload.requestId : normalizedRequestId,
        status: typeof payload.status === 'string' ? payload.status : 'pending',
        requestedAt: typeof payload.requestedAt === 'string' ? payload.requestedAt : null,
        completedAt: typeof payload.completedAt === 'string' ? payload.completedAt : null,
        rejectedReason: typeof payload.rejectedReason === 'string' ? payload.rejectedReason : null,
      })
    } catch {
      setStatusError('삭제 요청 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submitDeletionRequest} className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(8,34,55,0.08)] sm:p-7">
        <h2 className="text-xl font-semibold text-[var(--ink)]">상담 데이터 삭제 요청</h2>
        <label className="mt-5 block">
          <span className="text-sm font-semibold text-[var(--ink)]">전체 상태 링크 또는 장기 토큰</span>
          <input
            type="text"
            autoComplete="off"
            value={lookup}
            onChange={(event) => setLookup(event.target.value)}
            placeholder="https://app.happydoctor.kr/status?lang=ko#token=…"
            className="mt-3 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:bg-white"
          />
        </label>
        <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
          6자리 조회 코드는 본인 확인에 충분하지 않아 삭제 요청에 사용할 수 없습니다. 장기 토큰은 운영자에게 전송되는 동안 보호되며 URL 쿼리에 다시 저장하지 않습니다.
        </p>
        <label className="mt-5 flex items-start gap-3 rounded-[1.2rem] bg-[var(--surface)] p-4">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--line)] text-[var(--navy)] focus:ring-[var(--blue)]"
          />
          <span className="text-sm leading-7 text-[var(--ink)]">
            삭제가 완료되면 상담 내용, 의료진 답변, 첨부 사진과 알림 연락처를 복구할 수 없음을 확인합니다.
          </span>
        </label>
        {error ? <p className="mt-4 rounded-[1.2rem] bg-[#fff3ee] p-4 text-sm leading-7 text-[#9b5031]">{error}</p> : null}
        <button type="submit" disabled={submitting} className="mt-5 w-full rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
          {submitting ? '삭제 요청 접수 중…' : '삭제 요청 접수'}
        </button>
      </form>

      {receipt ? (
        <section className="rounded-[2rem] border border-[#b9dfc7] bg-[#f4fbf6] p-5 sm:p-7" aria-live="polite">
          <p className="text-sm font-semibold text-[#2f6b45]">삭제 요청이 접수되었습니다.</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-semibold text-[var(--ink)]">요청 번호</dt><dd className="mt-1 break-all text-[var(--muted)]">{receipt.requestId}</dd></div>
            <div><dt className="font-semibold text-[var(--ink)]">영수증 토큰</dt><dd className="mt-1 break-all font-mono text-[var(--muted)]">{receipt.receiptToken}</dd></div>
            <div><dt className="font-semibold text-[var(--ink)]">현재 상태</dt><dd className="mt-1 text-[var(--muted)]">{statusLabels[receipt.status] || receipt.status}</dd></div>
          </dl>
          <p className="mt-4 text-xs leading-6 text-[var(--muted)]">영수증 토큰은 이 화면을 벗어나면 다시 보여 드리지 않습니다. 지금 안전한 곳에 복사해 두고 다른 사람과 공유하지 마세요.</p>
          <button type="button" onClick={copyReceipt} className="mt-4 rounded-full border border-[#90c5a4] bg-white px-5 py-2.5 text-sm font-semibold text-[#2f6b45]">
            {copied ? '복사했습니다' : '요청 번호와 토큰 복사'}
          </button>
        </section>
      ) : null}

      <form onSubmit={checkDeletionStatus} className="rounded-[2rem] border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(8,34,55,0.06)] sm:p-7">
        <h2 className="text-xl font-semibold text-[var(--ink)]">삭제 처리 상태 확인</h2>
        <div className="mt-5 grid gap-4">
          <label><span className="text-sm font-semibold text-[var(--ink)]">요청 번호</span><input type="text" autoComplete="off" value={requestId} onChange={(event) => setRequestId(event.target.value)} className="mt-2 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--blue)]" /></label>
          <label><span className="text-sm font-semibold text-[var(--ink)]">영수증 토큰</span><input type="password" autoComplete="off" value={receiptToken} onChange={(event) => setReceiptToken(event.target.value)} className="mt-2 w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--blue)]" /></label>
        </div>
        {statusError ? <p className="mt-4 rounded-[1.2rem] bg-[#fff3ee] p-4 text-sm leading-7 text-[#9b5031]">{statusError}</p> : null}
        <button type="submit" disabled={checking} className="mt-5 rounded-[1.2rem] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400">
          {checking ? '확인 중…' : '처리 상태 확인'}
        </button>
        {statusResult ? (
          <div className="mt-5 rounded-[1.2rem] bg-[var(--soft-blue)] p-4 text-sm leading-7 text-[var(--ink)]" aria-live="polite">
            <p><strong>현재 상태:</strong> {statusLabels[statusResult.status || ''] || statusResult.status}</p>
            {statusResult.requestedAt ? <p><strong>접수 시각:</strong> {new Date(statusResult.requestedAt).toLocaleString('ko-KR')}</p> : null}
            {statusResult.completedAt ? <p><strong>완료 시각:</strong> {new Date(statusResult.completedAt).toLocaleString('ko-KR')}</p> : null}
            {statusResult.rejectedReason ? <p><strong>처리 안내:</strong> {statusResult.rejectedReason}</p> : null}
          </div>
        ) : null}
      </form>
    </div>
  )
}
