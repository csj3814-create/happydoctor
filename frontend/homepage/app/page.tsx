'use client'

import { useEffect, useState } from 'react'

// BI 컬러
const C = {
  mainBlue: '#185FA5',
  deepBlue: '#0C447C',
  sky: '#E6F1FB',
  green: '#1D9E75',
}

// --- 로고 SVG (제비+십자가) ---
function LogoSVG({ size = 48, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 22 C10 14, 20 19, 24 23 C20 19, 13 27, 4 30 Z" fill={color} opacity="0.9"/>
      <path d="M44 22 C38 14, 28 19, 24 23 C28 19, 35 27, 44 30 Z" fill={color} opacity="0.9"/>
      <ellipse cx="24" cy="23" rx="4.5" ry="6" fill={color}/>
      <path d="M20 29 L24 38 L28 29" fill={color} opacity="0.85"/>
      <rect x="22" y="7" width="4" height="12" rx="2" fill={color} opacity="0.75"/>
      <rect x="16" y="12" width="16" height="4" rx="2" fill={color} opacity="0.75"/>
    </svg>
  )
}

// --- 통계 훅 ---
interface Stats { total: number; doctorReplied: number }

function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    fetch('https://happydoctor.onrender.com/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats({ total: 312, doctorReplied: 295 }))
  }, [])
  return stats
}


// --- 활동 스토리 ---
const STORIES = [
  { title: '대한응급의학의사회 MOU', img: '/stories/mou-emergency.jpg' },
  { title: '해피닥터 정기총회', img: '/stories/general-meeting.jpg' },
  { title: '서대문농아인복지관 MOU', img: '/stories/mou-deaf.jpg' },
  { title: '행복한 의사 봉사활동', img: '/stories/volunteer.jpg' },
]

// ===== 섹션 컴포넌트 =====

function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-screen text-white text-center px-4 py-24"
      style={{ background: `linear-gradient(155deg, ${C.deepBlue} 0%, ${C.mainBlue} 100%)` }}
    >
      <div className="flex flex-col items-center gap-6 max-w-2xl">
        <LogoSVG size={72} color="#fff" />
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">행복한 의사</h1>
          <p className="mt-1 text-base md:text-lg font-medium" style={{ opacity: 0.7 }}>Happy Doctor</p>
        </div>
        <p className="text-xl md:text-2xl font-medium leading-relaxed" style={{ opacity: 0.92 }}>
          동화 행복한 왕자 속 제비처럼, 필요한 곳에 닿는 의료
        </p>
        <p className="text-sm md:text-base leading-relaxed max-w-md" style={{ opacity: 0.65 }}>
          의료 취약계층을 위한 무료 온라인 의료상담.<br />
          각 과 의료진이 직접 답변합니다.
        </p>
        <a
          href="http://pf.kakao.com/_PxaTxhX/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ background: '#FEE500', color: '#3C1E1E' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.77 1.68 5.21 4.24 6.73L5.5 21l3.93-2.07c.84.18 1.7.28 2.57.28 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
          </svg>
          카카오톡으로 상담하기
        </a>
      </div>
      <div className="absolute bottom-8 animate-bounce" style={{ opacity: 0.4 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </section>
  )
}

function Features() {
  const items = [
    { icon: '🩺', title: '완전 무료', desc: '건강보험 없이도 누구나. 노숙자, 외국인, 다문화 가정 등 의료 접근이 어려운 모든 분들을 위한 서비스입니다.' },
    { icon: '👨‍⚕️', title: '전문의 직접 답변', desc: '자원봉사 각 과 의료진 선생님들이 직접 검토하고 답변드립니다.' },
    { icon: '⏱️', title: '8시간 이내 목표', desc: '긴급 상황에서도 최대한 빠르게. 8시간 이내 답변을 목표로 합니다.' },
    { icon: '🌍', title: '다국어 지원', desc: '모국어로 상담하세요. 한국어가 아니어도 괜찮습니다.' },
  ]
  return (
    <section className="py-20 px-4" style={{ background: C.sky }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: C.deepBlue }}>
          행복한 의사는 이런 서비스입니다
        </h2>
        <p className="text-center text-sm mb-12" style={{ color: C.mainBlue, opacity: 0.7 }}>
          병원 가기 어려운 분들, 여행 중인 분들, 의료 취약계층 누구에게나 열려 있습니다
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm flex gap-4">
              <span className="text-3xl shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: C.mainBlue }}>{f.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-center text-zinc-400">
          ※ 본 상담은 최종적인 의료행위가 아닙니다. 반드시 가까운 의료기관을 통해 방문 진료받으실 것을 권장합니다.
        </p>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = useStats()
  const items = [
    { label: '누적 상담', value: stats?.total ?? null, unit: '건' },
    { label: '전문의 직접 회신', value: stats?.doctorReplied ?? null, unit: '건' },
  ]
  return (
    <section className="py-16 px-4 text-white" style={{ background: C.mainBlue }}>
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium mb-10" style={{ opacity: 0.7 }}>지금까지 함께한 기록</p>
        <div className="flex justify-center gap-16 md:gap-24">
          {items.map((it) => (
            <div key={it.label}>
              <div className="text-4xl md:text-6xl font-bold">
                {it.value !== null ? it.value.toLocaleString() : <span className="opacity-30">—</span>}
                <span className="text-lg md:text-xl ml-1" style={{ opacity: 0.6 }}>{it.unit}</span>
              </div>
              <div className="text-xs mt-2" style={{ opacity: 0.6 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowToSection() {
  const steps = [
    { n: '01', title: '카카오 채널 접속', desc: '아래 버튼 또는 카카오톡에서 "행복한 의사"를 검색하세요.' },
    { n: '02', title: '증상 입력', desc: '나이, 성별, 주요 증상을 안내에 따라 입력합니다. 모국어로 작성해도 됩니다.' },
    { n: '03', title: 'AI 예진 + 전문의 검토', desc: 'AI가 먼저 분석하고, 필요 시 각 과 의료진이 직접 답변합니다.' },
    { n: '04', title: '카카오톡으로 답변 수신', desc: '최대 8시간 이내 답변을 목표로 합니다. 추가 질문도 가능합니다.' },
  ]
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: C.deepBlue }}>
          이렇게 사용하세요
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: C.mainBlue }}>
                {s.n}
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: C.deepBlue }}>{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <a
            href="http://pf.kakao.com/_PxaTxhX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: C.mainBlue }}
          >
            지금 바로 상담하기 →
          </a>
        </div>
      </div>
    </section>
  )
}

// --- Q&A 섹션: 질문 앞 20자 + 의사 답변 전체 ---
interface QAItem { idx: number; q: string; a: string; date: string }

const PAGE_SIZE = 8

function QASection() {
  const [allQA, setAllQA] = useState<QAItem[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    fetch('/qna.json').then(r => r.json()).then(setAllQA).catch(() => {})
  }, [])

  const filtered = allQA.filter(d => {
    if (!search.trim()) return true
    const kw = search.trim().toLowerCase()
    // 질문 전체 + 답변에서 검색 (표시는 20자만)
    return d.q.toLowerCase().includes(kw) || d.a.toLowerCase().includes(kw)
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(v: string) { setSearch(v); setPage(1); setExpanded(null) }
  function handlePage(p: number) { setPage(p); setExpanded(null); }

  return (
    <section className="py-20 px-4" style={{ background: C.sky }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: C.deepBlue }}>
          이런 상담을 도와드리고 있어요
        </h2>
        <p className="text-center text-sm mb-8 text-zinc-400">
          {allQA.length > 0
            ? `실제 상담 사례 ${allQA.length.toLocaleString()}건 — 질문은 요약, 의사 답변 전체 공개`
            : '다양한 증상과 상황에 대해 전문의가 답변드립니다'}
        </p>

        {/* 검색 */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="증상이나 키워드로 검색..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 text-sm shadow-sm focus:outline-none"
          />
          <svg className="absolute left-3 top-3.5 opacity-40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 text-sm">✕</button>
          )}
        </div>
        {search && <p className="text-xs text-zinc-400 mb-4">&ldquo;{search}&rdquo; 검색 결과 {filtered.length}건</p>}

        {/* 목록 */}
        {allQA.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">불러오는 중...</div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">검색 결과가 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {paged.map((qa) => {
              const qPreview = qa.q.slice(0, 20) + (qa.q.length > 20 ? '...' : '')
              const isOpen = expanded === qa.idx
              return (
                <div key={qa.idx} className="rounded-2xl overflow-hidden shadow-sm border border-zinc-100 bg-white">
                  <button
                    className="w-full text-left px-5 py-4 flex gap-3 items-center hover:bg-zinc-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : qa.idx)}
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: C.mainBlue }}>Q</span>
                    <p className="flex-1 text-sm font-medium text-zinc-700">{qPreview}</p>
                    <svg className="shrink-0 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', opacity: 0.4 }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 py-4 flex gap-3 border-t border-zinc-100" style={{ background: C.sky }}>
                      <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5" style={{ background: C.green }}>A</span>
                      <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{qa.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button onClick={() => handlePage(Math.max(1, page-1))} disabled={page===1}
              className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 bg-white disabled:opacity-40">←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page-2, totalPages-4))
              const p = start + i
              return (
                <button key={p} onClick={() => handlePage(p)}
                  className="px-3 py-1.5 rounded-lg text-sm border font-medium transition"
                  style={page===p ? {background:C.mainBlue,color:'#fff',borderColor:C.mainBlue} : {background:'#fff',borderColor:'#e4e4e7'}}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => handlePage(Math.min(totalPages, page+1))} disabled={page===totalPages}
              className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 bg-white disabled:opacity-40">→</button>
          </div>
        )}

        <div className="mt-10 text-center">
          <a href="http://pf.kakao.com/_PxaTxhX/chat" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: C.mainBlue }}>
            나도 상담받기 →
          </a>
        </div>
      </div>
    </section>
  )
}

function StoriesSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: C.deepBlue }}>
          Happy Doctor Story
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STORIES.map((s) => (
            <div key={s.title} className="rounded-2xl overflow-hidden shadow-sm border border-zinc-100">
              <div className="aspect-square overflow-hidden bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.img}
                  alt={s.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-zinc-700 leading-snug">{s.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DonateSection() {
  return (
    <section className="py-20 px-4 text-white" style={{ background: C.green }}>
      <div className="max-w-xl mx-auto text-center">
        <p className="text-3xl mb-4">🐦</p>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">함께 날아주세요</h2>
        <p className="leading-relaxed mb-8 text-sm md:text-base" style={{ opacity: 0.9 }}>
          행복한 의사는 자원봉사 의사 선생님들과 후원자의 도움으로 운영됩니다.<br />
          소중한 후원이 의료 취약계층에게 닿습니다.
        </p>
        <div className="bg-white rounded-2xl p-6 text-left max-w-xs mx-auto" style={{ color: C.deepBlue }}>
          <p className="text-xs font-semibold mb-1" style={{ opacity: 0.6 }}>후원 계좌</p>
          <p className="text-lg font-bold">신한은행</p>
          <p className="text-2xl font-bold tracking-widest mt-1">100-034-864699</p>
          <p className="text-sm mt-1" style={{ opacity: 0.7 }}>예금주: 행복한의사</p>
        </div>
        <p className="mt-6 text-xs" style={{ opacity: 0.6 }}>
          주변에 도움이 필요한 분이 계시면 이 채널을 알려주세요. 🙏
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-4 text-white" style={{ background: C.deepBlue }}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <LogoSVG size={36} color="#fff" />
          <div>
            <p className="font-bold text-base">행복한 의사</p>
            <p className="text-xs" style={{ opacity: 0.5 }}>Happy Doctor</p>
          </div>
        </div>
        <div className="text-xs space-y-1" style={{ opacity: 0.55 }}>
          <p>비영리법인 고유번호 111-82-67141</p>
          <p>대표 최석재 (응급의학과 전문의)</p>
          <p>서울특별시 영등포구 선유로9길 10, skv1 616</p>
        </div>
        <a
          href="http://pf.kakao.com/_PxaTxhX/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition hover:opacity-80 shrink-0"
          style={{ background: '#FEE500', color: '#3C1E1E' }}
        >
          카카오 채널 바로가기
        </a>
      </div>
      <div className="max-w-4xl mx-auto mt-8 pt-6 border-t text-xs text-center" style={{ borderColor: 'rgba(255,255,255,0.1)', opacity: 0.4 }}>
        © 2024–2026 행복한 의사 / Happy Doctor. All rights reserved.
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <StatsSection />
      <HowToSection />
      <QASection />
      <StoriesSection />
      <DonateSection />
      <Footer />
    </main>
  )
}
