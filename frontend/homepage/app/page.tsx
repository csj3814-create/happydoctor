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
          동화 행복한 왕자 속 제비처럼<br />필요할 때 가까이 손 닿는 의료
        </p>
        <p className="text-sm md:text-base leading-relaxed max-w-md" style={{ opacity: 0.65 }}>
          의료 취약계층을 위한 무료 온라인 의료상담.<br />
          각 과 의료진이 직접 답변합니다.
        </p>
        <a
          href="https://pf.kakao.com/_PxaTxhX/chat"
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

// --- 설립 이야기 ---
function FoundingStory() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: C.sky }}>
              🐦
            </div>
            <p className="text-xs font-semibold text-center" style={{ color: C.mainBlue }}>2020.10 설립</p>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: C.deepBlue }}>
              왜 행복한 의사인가요?
            </h2>
            <p className="text-sm md:text-base text-zinc-600 leading-relaxed mb-4">
              동화 <em className="not-italic font-semibold" style={{ color: C.mainBlue }}>「행복한 왕자」</em> 속 제비는
              왕자의 금장식과 보석을 어려운 이웃들에게 전달하는 의로운 메신저였습니다.
              행복한 의사는 그 제비처럼, 의사 선생님의 손길이 필요한 곳에 닿게 하고자 합니다.
            </p>
            <p className="text-sm md:text-base text-zinc-600 leading-relaxed mb-4">
              코로나19 대유행은 계층 간·지역 간 의료 사각지대를 여실히 드러냈습니다.
              무의촌 거주자, 경제적으로 어려운 취약계층, 언어소통에 어려움을 겪는 농아인·
              다문화가정이 의료 혜택에서 소외되고 있었습니다.
            </p>
            <p className="text-sm md:text-base text-zinc-600 leading-relaxed">
              자원봉사 의료진이 재능을 기부하고, 어려운 이웃에게 <strong>완전 무료</strong>로
              전문 의료상담을 제공합니다. 모든 서비스는 100% 무료입니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- 통계 ---
function StatsSection() {
  const stats = useStats()
  const items = [
    { label: '누적 상담', value: stats?.total ?? null, unit: '건', dynamic: true },
    { label: '전문의 직접 회신', value: stats?.doctorReplied ?? null, unit: '건', dynamic: true },
    { label: '잠재 수혜 인구', value: 67700, unit: '명+', dynamic: false },
    { label: 'MOU 협력기관', value: 6, unit: '개', dynamic: false },
  ]
  return (
    <section className="py-16 px-4 text-white" style={{ background: C.mainBlue }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm font-medium mb-10" style={{ opacity: 0.7 }}>지금까지 함께한 기록</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.label}>
              <div className="text-3xl md:text-4xl font-bold">
                {it.dynamic
                  ? (it.value !== null ? it.value.toLocaleString() : <span className="opacity-30">—</span>)
                  : it.value!.toLocaleString()
                }
                <span className="text-sm md:text-base ml-1" style={{ opacity: 0.6 }}>{it.unit}</span>
              </div>
              <div className="text-xs mt-1" style={{ opacity: 0.6 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- 서비스 소개 ---
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

// --- 이용방법 ---
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
          <a href="https://pf.kakao.com/_PxaTxhX/chat" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: C.mainBlue }}>
            지금 바로 상담하기 →
          </a>
        </div>
      </div>
    </section>
  )
}

// --- 협력기관 ---
const PARTNERS = [
  { name: '대한응급의학의사회', desc: '전국 응급의학과 의사 네트워크', icon: '🏥' },
  { name: '부평구다문화가족센터', desc: '다문화가족 회원 약 7,700명', icon: '🌏' },
  { name: '서울특별시농아인협회', desc: '농아인 및 관계자 약 60,000명', icon: '🤝' },
  { name: '서울시립서대문농아인복지관', desc: '청각장애인 복지서비스 기관', icon: '💙' },
  { name: '요셉의원', desc: '국내외 외국인·빈민지역 환자 지원', icon: '✝️' },
  { name: '다가치', desc: '이주민 의료지원 체계 구축 협력', icon: '🌱' },
]

function PartnersSection() {
  return (
    <section className="py-20 px-4" style={{ background: C.sky }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: C.deepBlue }}>
          함께하는 기관
        </h2>
        <p className="text-center text-sm mb-12 text-zinc-400">
          MOU 협력기관과 함께 의료 사각지대 해소에 나서고 있습니다
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PARTNERS.map((p) => (
            <div key={p.name} className="bg-white rounded-2xl p-5 shadow-sm flex gap-3 items-start">
              <span className="text-2xl shrink-0">{p.icon}</span>
              <div>
                <p className="font-bold text-sm mb-0.5" style={{ color: C.deepBlue }}>{p.name}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- 연혁 타임라인 ---
const TIMELINE = [
  { year: '2020.10', title: '행복한 의사 설립', desc: 'COVID-19 의료 사각지대 해소를 위해 자원봉사 의사들이 뭉쳐 설립' },
  { year: '2021.09', title: '요셉의원 MOU', desc: '국내외 외국인·빈민지역 환자 의료상담 협력 체결. 동아일보 보도' },
  { year: '2022.01', title: '부평구다문화가족센터 MOU', desc: '인천 다문화가족 7,700명 대상 무료 온라인 의료상담 서비스 개시' },
  { year: '2022.08', title: '서울특별시농아인협회 MOU', desc: '농아인 60,000명 대상 의료상담 서비스 확대' },
  { year: '2022.10', title: '서대문농아인복지관 MOU 및 소아응급 강의', desc: '다문화·농아인 대상 의료 교육 봉사 정례화' },
  { year: '2023.02', title: '사단법인 창립총회', desc: '임의단체에서 비영리법인으로 전환. 자원봉사 의료진 16명 체제' },
  { year: '2023.04', title: '다가치 MOU', desc: '이주민 의료지원 체계 구축을 위한 협약 체결' },
  { year: '2023.05', title: '인천 세계인의날 봉사', desc: '다문화가정 대상 현장 의료상담 봉사 참여' },
  { year: '2024–2026', title: '카카오톡 채널 + AI 예진 도입', desc: '언제 어디서나 상담 가능한 AI 기반 스마트 의료상담 시스템 구축' },
]

function TimelineSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: C.deepBlue }}>
          활동 연혁
        </h2>
        <div className="relative">
          {/* 세로선 */}
          <div className="absolute left-[72px] top-0 bottom-0 w-px" style={{ background: C.sky }} />
          <div className="flex flex-col gap-8">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div className="shrink-0 w-[72px] text-right">
                  <span className="text-xs font-bold" style={{ color: C.mainBlue }}>{item.year}</span>
                </div>
                <div className="shrink-0 w-3 h-3 rounded-full mt-0.5 relative z-10"
                  style={{ background: i === TIMELINE.length - 1 ? C.green : C.mainBlue }} />
                <div className="pb-2">
                  <p className="font-bold text-sm mb-0.5" style={{ color: C.deepBlue }}>{item.title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// --- 활동 갤러리 ---
const GALLERY = [
  { src: '/gallery/founding-ceremony.jpg', caption: '사단법인 창립총회 (2023.02)' },
  { src: '/gallery/founding-ceremony2.jpg', caption: '창립총회 — 함께하는 사람들' },
  { src: '/gallery/lecture-deaf.jpg', caption: '서울시농아인협회 의료강의' },
  { src: '/gallery/mou-dagachi.jpg', caption: '다가치 MOU 체결 (2023.04)' },
  { src: '/gallery/mou-dagachi2.jpg', caption: '다가치 업무협약식' },
  { src: '/gallery/world-day1.jpg', caption: '인천 세계인의날 봉사 (2023.05)' },
  { src: '/gallery/world-day2.jpg', caption: '세계인의날 — 다문화가정 현장상담' },
  { src: '/gallery/world-day3.jpg', caption: '세계인의날 — 어린이 상담' },
  { src: '/stories/mou-emergency.jpg', caption: '대한응급의학의사회 MOU' },
  { src: '/stories/mou-deaf.jpg', caption: '서대문농아인복지관 MOU' },
  { src: '/gallery/lecture-multicultural.jpg', caption: '부평구다문화가족센터 의료강의 (2023.11)' },
  { src: '/stories/volunteer.jpg', caption: '행복한 의사 봉사활동' },
]

function GallerySection() {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <section className="py-20 px-4" style={{ background: C.sky }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: C.deepBlue }}>
          Happy Doctor Story
        </h2>
        <p className="text-center text-sm mb-10 text-zinc-400">현장에서 함께한 순간들</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GALLERY.map((g, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className="rounded-xl overflow-hidden shadow-sm border border-zinc-100 bg-white group text-left"
            >
              <div className="aspect-square overflow-hidden bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-2">
                <p className="text-xs text-zinc-600 leading-snug">{g.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 라이트박스 */}
      {selected !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GALLERY[selected].src} alt={GALLERY[selected].caption}
              className="w-full rounded-xl shadow-2xl" />
            <p className="text-white text-center text-sm mt-3 opacity-80">{GALLERY[selected].caption}</p>
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => setSelected(Math.max(0, selected - 1))} disabled={selected === 0}
                className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm disabled:opacity-30">← 이전</button>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm">닫기</button>
              <button onClick={() => setSelected(Math.min(GALLERY.length - 1, selected + 1))} disabled={selected === GALLERY.length - 1}
                className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm disabled:opacity-30">다음 →</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// --- Q&A 섹션 ---
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
    return d.q.toLowerCase().includes(kw) || d.a.toLowerCase().includes(kw)
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(v: string) { setSearch(v); setPage(1); setExpanded(null) }
  function handlePage(p: number) { setPage(p); setExpanded(null) }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: C.deepBlue }}>
          이런 상담을 도와드리고 있어요
        </h2>
        <p className="text-center text-sm mb-8 text-zinc-400">
          {allQA.length > 0
            ? `실제 상담 사례 ${allQA.length.toLocaleString()}건 — 질문은 요약, 의사 답변 전체 공개`
            : '다양한 증상과 상황에 대해 전문의가 답변드립니다'}
        </p>

        <div className="relative mb-6">
          <input type="text" placeholder="증상이나 키워드로 검색..." value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 text-sm shadow-sm focus:outline-none" />
          <svg className="absolute left-3 top-3.5 opacity-40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 text-sm">✕</button>
          )}
        </div>
        {search && <p className="text-xs text-zinc-400 mb-4">&ldquo;{search}&rdquo; 검색 결과 {filtered.length}건</p>}

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
                    onClick={() => setExpanded(isOpen ? null : qa.idx)}>
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: C.mainBlue }}>Q</span>
                    <p className="flex-1 text-sm font-medium text-zinc-700">{qPreview}</p>
                    <svg className="shrink-0 transition-transform duration-200"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', opacity: 0.4 }}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button onClick={() => handlePage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 bg-white disabled:opacity-40">←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = start + i
              return (
                <button key={p} onClick={() => handlePage(p)}
                  className="px-3 py-1.5 rounded-lg text-sm border font-medium transition"
                  style={page === p ? { background: C.mainBlue, color: '#fff', borderColor: C.mainBlue } : { background: '#fff', borderColor: '#e4e4e7' }}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => handlePage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 bg-white disabled:opacity-40">→</button>
          </div>
        )}

        <div className="mt-10 text-center">
          <a href="https://pf.kakao.com/_PxaTxhX/chat" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: C.mainBlue }}>
            나도 상담받기 →
          </a>
        </div>
      </div>
    </section>
  )
}

// --- 대표 소개 ---
function CEOSection() {
  return (
    <section className="py-20 px-4" style={{ background: C.sky }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: C.deepBlue }}>
          대표 소개
        </h2>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* 사진 */}
            <div className="shrink-0 md:w-52 bg-zinc-50 flex items-center justify-center p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ceo.png" alt="최석재 대표" className="w-36 h-36 md:w-40 md:h-40 object-cover rounded-full shadow" />
            </div>
            {/* 정보 */}
            <div className="flex-1 p-8">
              <div className="mb-4">
                <h3 className="text-xl font-bold" style={{ color: C.deepBlue }}>최석재</h3>
                <p className="text-sm text-zinc-500">응급의학과 전문의 · 행복한 의사 대표</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold mb-1.5" style={{ color: C.mainBlue }}>현직</p>
                  <ul className="space-y-0.5 text-zinc-600">
                    <li>행복한 의사 Happy Doctor 대표</li>
                    <li>습관학교 해빛스쿨 운영</li>
                    <li>유튜브 건방진 닥터스 채널 운영</li>
                    <li>베지닥터 상임이사</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold mb-1.5" style={{ color: C.mainBlue }}>전직</p>
                  <ul className="space-y-0.5 text-zinc-600">
                    <li>대한응급의학의사회 홍보이사</li>
                    <li>대한응급의학회 공보위원</li>
                    <li>가천대학교 의과대학 졸업</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold mb-1.5" style={{ color: C.mainBlue }}>저서</p>
                  <ul className="space-y-0.5 text-zinc-600">
                    <li>몸이 보내는 마지막 신호들 30 (2025)</li>
                    <li>우리 아이 응급 주치의 (2020)</li>
                    <li>응급실에 아는 의사가 생겼다 (2017)</li>
                    <li>50대 이후 모르면 안되는 건강 지식한상 (공저)</li>
                    <li>응급의학과 1막 22장, 개척자들 (공저)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold mb-1.5" style={{ color: C.mainBlue }}>방송 출연</p>
                  <ul className="space-y-0.5 text-zinc-600">
                    <li>MBC 기분좋은날 명사특강, 심뇌혈관질환 편 (2025)</li>
                    <li>MBC 닥터스, 길병원 편 (2007)</li>
                    <li>EBS 극한직업, 응급실 의사 편 (2008)</li>
                    <li>KBS 생명최전선, 요셉의원 편 (2014)</li>
                    <li>TvN 유퀴즈온더블록 (2020)</li>
                    <li>SBS 빅퀘스천 (2024) 외 다수</li>
                  </ul>
                </div>
              </div>
              <div className="mt-5 flex gap-3 flex-wrap">
                <a href="https://blog.naver.com/csj3814" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium hover:opacity-80 transition"
                  style={{ borderColor: C.mainBlue, color: C.mainBlue }}>
                  📝 네이버 블로그
                </a>
                <a href="https://www.youtube.com/@doctors0" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium hover:opacity-80 transition"
                  style={{ borderColor: '#FF0000', color: '#FF0000' }}>
                  ▶ 건방진 닥터스
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- 자원봉사 의사 모집 ---
function VolunteerSection() {
  return (
    <section className="py-16 px-4 text-white" style={{ background: C.deepBlue }}>
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-2xl mb-3">👩‍⚕️</p>
        <h2 className="text-xl md:text-2xl font-bold mb-3">함께할 의사 선생님을 찾습니다</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ opacity: 0.75 }}>
          재능기부 형태로 참여하는 자원봉사 의료진을 모집합니다.<br />
          여러분의 전문성이 의료 사각지대에 닿을 수 있습니다.
        </p>
        <a href="https://open.kakao.com/me/csj3814" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition hover:opacity-90"
          style={{ background: '#fff', color: C.deepBlue }}>
          참여 문의하기 →
        </a>
      </div>
    </section>
  )
}

// --- 후원 ---
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

// --- 푸터 ---
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
        <a href="https://pf.kakao.com/_PxaTxhX" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition hover:opacity-80 shrink-0"
          style={{ background: '#FEE500', color: '#3C1E1E' }}>
          카카오 채널 바로가기
        </a>
      </div>
      <div className="max-w-4xl mx-auto mt-8 pt-6 border-t text-xs text-center"
        style={{ borderColor: 'rgba(255,255,255,0.1)', opacity: 0.4 }}>
        © 2024–2026 행복한 의사 / Happy Doctor. All rights reserved.
      </div>
    </footer>
  )
}

// ===== 메인 =====
export default function HomePage() {
  return (
    <main>
      <Hero />
      <FoundingStory />
      <StatsSection />
      <Features />
      <HowToSection />
      <PartnersSection />
      <TimelineSection />
      <GallerySection />
      <QASection />
      <CEOSection />
      <VolunteerSection />
      <DonateSection />
      <Footer />
    </main>
  )
}
