import { Suspense } from 'react'

import StatusPageClient from '@/components/StatusPageClient'

function StatusPageFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_32%,#f7fbff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-6 sm:px-8">
        <section className="mt-12 rounded-[2rem] border border-[var(--line)] bg-white p-6 text-sm leading-7 text-[var(--muted)] shadow-[0_18px_50px_rgba(8,34,55,0.06)]">
          상담 상태를 불러오고 있습니다...
        </section>
      </div>
    </main>
  )
}

export default function StatusPage() {
  return (
    <Suspense fallback={<StatusPageFallback />}>
      <StatusPageClient />
    </Suspense>
  )
}
