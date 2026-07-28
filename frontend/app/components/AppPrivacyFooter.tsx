import Link from 'next/link'

export default function AppPrivacyFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-xs leading-6 text-[var(--muted)] sm:px-8 md:flex-row md:items-center md:justify-between">
        <p>
          비영리단체 행복한 의사 · 대표 최석재 · 개인정보 문의{' '}
          <a className="font-medium text-[var(--ink)] hover:underline" href="mailto:president@happydoctor.kr">
            president@happydoctor.kr
          </a>
        </p>
        <nav aria-label="개인정보 안내" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="font-semibold text-[var(--ink)] hover:underline" href="/privacy">
            개인정보처리방침 / Privacy
          </Link>
          <Link className="font-semibold text-[var(--ink)] hover:underline" href="/delete-data">
            상담 데이터 삭제요청 / Delete data
          </Link>
        </nav>
      </div>
    </footer>
  )
}
