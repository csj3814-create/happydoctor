import type { Metadata } from 'next'
import Link from 'next/link'

import DataDeletionRequestForm from '@/components/DataDeletionRequestForm'

export const metadata: Metadata = {
  title: '상담 데이터 삭제요청 | 해피닥터',
  description: '해피닥터 상담 데이터 삭제를 요청하고 처리 상태를 확인합니다.',
  alternates: { canonical: '/delete-data' },
}

export default function DeleteDataPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_28%,#f7fbff_100%)]">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="rounded-[2rem] bg-[var(--navy)] p-6 text-white shadow-[0_24px_60px_rgba(7,28,49,0.18)] sm:p-8">
          <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Delete consultation data</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">상담 데이터 삭제요청</h1>
          <p className="mt-4 text-sm leading-7 text-white/82">해피닥터는 별도 회원 계정을 만들지 않습니다. 상담 접수 시 받은 비밀 상태 링크의 장기 토큰으로 본인 상담 데이터 삭제를 요청할 수 있습니다.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)]">앱 홈으로</Link>
            <Link href="/privacy" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white">개인정보처리방침</Link>
          </div>
        </header>

        <section className="mt-7 rounded-[1.7rem] border border-[#ffd7c9] bg-[#fff8f4] p-5 text-sm leading-7 text-[#74412e]">
          <h2 className="font-semibold">요청 전에 확인해 주세요</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>삭제 요청이 접수되면 해당 장기 토큰을 통한 상담 조회가 제한됩니다.</li>
            <li>상담 내용, 의료진 답변, 사진과 알림 연락처가 삭제 대상입니다.</li>
            <li>법령상 보존 의무가 적용되는 정보는 삭제가 제한될 수 있으며, 그 경우 사유와 범위를 안내합니다.</li>
            <li>장기 토큰을 잃어버렸다면 <a className="font-semibold underline" href="mailto:president@happydoctor.kr">president@happydoctor.kr</a>로 문의해 주세요.</li>
          </ul>
        </section>

        <section className="mt-7">
          <DataDeletionRequestForm />
        </section>

        <section lang="en" className="mt-7 rounded-[1.7rem] border border-[#c9dcff] bg-[#f4f8ff] p-5 sm:p-7">
          <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-[var(--blue)]">English summary</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--ink)]">How to delete your data</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Happy Doctor does not require an account. Enter the complete private status link or its long-term token above; a six-character lookup code is not sufficient. After submitting, save the request ID and receipt token. They are shown once and are never placed in the URL. You can use them to check progress on this page. If you lost the long-term token, email president@happydoctor.kr.</p>
        </section>
      </div>
    </main>
  )
}
