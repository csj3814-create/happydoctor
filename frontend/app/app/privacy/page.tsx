import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 해피닥터',
  description: '해피닥터 상담 서비스의 개인정보 및 민감정보 처리 기준입니다.',
  alternates: { canonical: '/privacy' },
}

const policySections = [
  {
    title: '1. 개인정보 처리자와 적용 범위',
    body: (
      <>
        <p>비영리단체 「행복한 의사」(이하 “단체”)는 해피닥터 웹·앱에서 접수되는 상담과 상태 확인, 답변 알림 및 이용자 문의를 운영하기 위해 개인정보를 처리합니다.</p>
        <p>해피닥터는 응급의료를 대신하지 않습니다. 응급 상황에서는 119 또는 가까운 응급실을 먼저 이용해야 합니다.</p>
      </>
    ),
  },
  {
    title: '2. 처리하는 개인정보 항목',
    body: (
      <ul>
        <li><strong>필수 일반정보:</strong> 나이 또는 연령대, 성별(선택지에서 밝히지 않음 가능), 입력·답변 언어, 접수 경로, 상담 식별자와 장기 상태 토큰</li>
        <li><strong>필수 민감정보:</strong> 주요 증상, 발생 시점, 증상 점수, 상세 설명, 동반 증상, 과거력·기저질환·복용약</li>
        <li><strong>이용자가 선택하여 제출하는 정보:</strong> 상처·발진·약 포장 등의 사진, 답변 알림용 휴대전화번호 또는 이메일 주소</li>
        <li><strong>자동 생성 정보:</strong> 접수·조회·답변 시각, 처리 상태, 접속 IP 및 브라우저 정보 등 보안·오류 기록</li>
        <li><strong>기기 내 임시 저장:</strong> 작성 중인 상담 초안과 최근 상담 토큰은 현재 브라우저의 로컬 저장소에 최대 1시간 보관될 수 있습니다.</li>
      </ul>
    ),
  },
  {
    title: '3. 처리 목적과 동의',
    body: (
      <>
        <p>단체는 상담 접수, 의료진의 직접 검토와 답변, 상태 조회, 사진 추가, 후속 질문, 서비스 보안 및 이용자 요청 처리를 위해 위 정보를 사용합니다.</p>
        <p>일반 개인정보 수집·이용 동의와 건강정보 등 민감정보 처리 동의는 별도로 받습니다. 휴대전화 답변 알림은 선택 사항이며, 동의하지 않아도 웹에서 상담 상태를 확인할 수 있습니다.</p>
      </>
    ),
  },
  {
    title: '4. 보유 및 이용 기간',
    body: (
      <>
        <p>개인정보는 원칙적으로 처리 목적이 달성되거나 이용자가 적법하게 삭제를 요청하면 지체 없이 파기합니다. 답변 알림용 휴대전화번호와 이메일 주소는 알림 목적이 끝나면 우선 분리·삭제합니다.</p>
        <p><strong>확인 중인 사항:</strong> 이 서비스의 상담 기록이 관계 법령상 진료기록 등에 해당하는지 법률·운영 검토 중입니다. 법정 보존 의무가 적용되는 경우에는 그 기간을 우선하며, 적용 법령과 기간을 확정한 뒤 이 방침에 고지합니다. 확인되지 않은 임의의 보존기간을 법정기간처럼 표시하지 않습니다.</p>
        <p>보안 로그와 삭제 처리 영수증은 분쟁 대응 및 삭제 이행 증명을 위한 최소 기간만 보관하며, 구체 기간은 출시 전 내부 보유기간표를 확정하여 고지합니다.</p>
      </>
    ),
  },
  {
    title: '5. 의료진 열람과 제3자 제공',
    body: (
      <>
        <p>승인된 의료진은 상담 검토와 답변에 필요한 범위에서만 상담 내용을 열람합니다. 접근 권한, 열람 기록과 비밀유지 의무를 관리합니다.</p>
        <p>법령에 근거가 있거나 이용자가 별도로 동의한 경우를 제외하고 개인정보를 독립된 제3자의 목적을 위해 제공하지 않습니다. 의료진의 법적 지위가 별도 제3자 제공에 해당하는 운영 형태로 확정되는 경우, 제공받는 자·목적·항목·기간을 알리고 별도 동의를 받습니다.</p>
      </>
    ),
  },
  {
    title: '6. 처리업무 위탁 및 외부 서비스',
    body: (
      <>
        <p>서비스 제공에 필요한 범위에서 다음 사업자의 시스템을 사용할 수 있습니다. 실제 운영 계약과 기능 활성화 여부에 맞추어 수탁자 목록을 계속 갱신합니다.</p>
        <ul>
          <li><strong>Google Firebase / Google Cloud:</strong> 상담 데이터·사진 저장, 번역 등</li>
          <li><strong>Render:</strong> 백엔드 서버 운영</li>
          <li><strong>Vercel:</strong> 웹 화면 제공. 환자 화면의 Vercel Analytics는 사용하지 않습니다.</li>
          <li><strong>SOLAPI(누리고):</strong> 선택 동의한 이용자에게 답변 알림 문자 발송</li>
          <li><strong>Google Gmail(SMTP):</strong> 의료진 운영 알림 메일 발송과, 선택 동의한 이용자에게 답변 알림 메일 발송. 의료진 운영 알림 메일에는 상담 본문·사진·건강정보를 포함하지 않습니다.</li>
          <li><strong>Kakao 및 MessengerBotR 연동:</strong> 운영 알림과 상담 진입 지원. 운영 알림에는 상담 본문·사진을 포함하지 않는 것을 원칙으로 합니다.</li>
        </ul>
        <p>단체는 위탁계약과 접근통제를 통해 수탁자가 정해진 목적 밖에서 개인정보를 사용하지 않도록 관리합니다.</p>
      </>
    ),
  },
  {
    title: '7. 개인정보의 국외 처리·이전',
    body: (
      <>
        <p>클라우드·번역·호스팅 서비스 이용 과정에서 개인정보가 국외에서 처리될 수 있습니다.</p>
        <p><strong>출시 전 확인·고지 조건:</strong> 각 서비스의 실제 계약 주체, 이전 국가, 데이터 처리 리전, 이전 항목·시점·방법, 목적과 보유기간을 운영 콘솔 및 계약서에서 확인 중입니다. 확인을 마치기 전에는 이를 특정 국가나 리전으로 확정하여 표시하지 않으며, 상담 기능 활성화 전에 이 방침과 필요한 별도 동의 화면에 정확히 고지합니다. 이용자는 국외이전을 거부할 수 있고, 거부 시 해당 처리가 필요한 상담 기능 이용이 제한될 수 있습니다.</p>
      </>
    ),
  },
  {
    title: '8. 자동화 도구와 의료진 검토',
    body: (
      <>
        <p>출시 버전은 자동 임상분류, 자동 진단 또는 자동 의료조언으로 상담 결과를 결정하지 않습니다. 모든 상담은 의료진이 직접 검토합니다.</p>
        <p>번역이나 접수 내용의 형식 정리에 자동화 도구를 사용하는 경우에도 그 결과는 의료진을 위한 보조자료이며, 단독으로 치료 방향이나 응급도를 결정하지 않습니다.</p>
      </>
    ),
  },
  {
    title: '9. 이용자의 권리와 삭제 요청',
    body: (
      <>
        <p>이용자는 개인정보 열람, 정정, 처리정지와 삭제를 요청할 수 있습니다. 계정이 없는 서비스이므로 상담 접수 시 받은 장기 상태 토큰으로 <Link href="/delete-data">상담 데이터 삭제요청</Link>을 제출할 수 있습니다.</p>
        <p>장기 토큰을 분실한 경우 <a href="mailto:president@happydoctor.kr">president@happydoctor.kr</a>로 문의해 주세요. 본인 확인에는 기존에 선택 동의한 연락처 등 최소 정보만 사용하며, 증상 재진술이나 신분증 사본을 불필요하게 요구하지 않습니다. 법령상 보존 의무가 있는 정보는 삭제가 제한될 수 있으며 그 사유를 안내합니다.</p>
      </>
    ),
  },
  {
    title: '10. 파기 방법',
    body: <p>전자파일은 복구하기 어려운 방식으로 삭제하고, 데이터베이스 문서·첨부 사진·답변·알림 대기정보 등 관련 항목을 함께 삭제합니다. 법정 보존이 필요한 정보는 별도로 분리하여 해당 목적 외 이용을 제한합니다.</p>,
  },
  {
    title: '11. 안전성 확보조치',
    body: <p>전송구간 암호화, 장기 비밀 토큰을 이용한 상태 조회, 관리자 인증과 최소권한, 접근·오류 기록, 민감정보가 포함되지 않는 운영 알림, 비밀정보의 환경변수 관리 및 정기적인 취약점 점검을 적용합니다.</p>,
  },
  {
    title: '12. 쿠키와 기기 저장소',
    body: <p>환자 화면에는 광고 추적용 쿠키를 두지 않습니다. 작성 편의를 위해 브라우저 로컬 저장소에 상담 초안과 최근 상담 정보를 최대 1시간 저장할 수 있으며, 브라우저 설정에서 직접 삭제할 수 있습니다.</p>,
  },
  {
    title: '13. 만 18세 미만',
    body: <p>현재 서비스는 만 18세 이상 이용자를 대상으로 합니다. 만 18세 미만의 개인정보가 접수된 사실을 알게 되면 상담 안전과 관계 법령을 확인한 뒤 필요한 보호·삭제 조치를 합니다.</p>,
  },
  {
    title: '14. 개인정보 보호책임자와 문의처',
    body: (
      <ul>
        <li>처리자: 비영리단체 행복한 의사</li>
        <li>대표자·개인정보 보호책임자: 최석재</li>
        <li>고유번호: 111-82-67141</li>
        <li>주소: 서울특별시 영등포구 선유로9길 10, SK V1 616</li>
        <li>전화: 010-4100-9696</li>
        <li>이메일: <a href="mailto:president@happydoctor.kr">president@happydoctor.kr</a></li>
      </ul>
    ),
  },
  {
    title: '15. 방침 변경',
    body: <p>이 방침은 2026년 7월 28일 작성되었습니다. 국외 처리 리전, 수탁자 계약 및 법정 보존기간 검토를 마친 뒤 시행일 전에 확정 내용을 고지합니다. 중요한 변경은 적용 전에 서비스 화면을 통해 안내합니다.</p>,
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_24%,#f7fbff_100%)]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="rounded-[2rem] bg-[var(--navy)] p-6 text-white shadow-[0_24px_60px_rgba(7,28,49,0.18)] sm:p-8">
          <p className="display-face text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Privacy Policy</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">개인정보처리방침</h1>
          <p className="mt-4 text-sm leading-7 text-white/82">해피닥터 상담 서비스가 어떤 정보를 왜 처리하고, 이용자가 어떻게 권리를 행사할 수 있는지 안내합니다.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)]">앱 홈으로</Link>
        </header>

        <div className="mt-7 space-y-5">
          {policySections.map((section) => (
            <section key={section.title} className="rounded-[1.7rem] border border-[var(--line)] bg-white p-5 shadow-[0_14px_40px_rgba(8,34,55,0.05)] sm:p-7">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)] [&_a]:font-semibold [&_a]:text-[var(--blue)] [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">{section.body}</div>
            </section>
          ))}
        </div>

        <section lang="en" className="mt-7 rounded-[2rem] border border-[#c9dcff] bg-[#f4f8ff] p-6 sm:p-8">
          <p className="display-face text-xs font-semibold uppercase tracking-[0.22em] text-[var(--blue)]">English summary</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">Privacy summary</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
            <p>Happy Doctor, operated by the Korean nonprofit group “행복한 의사,” collects basic profile details, consultation messages, sensitive health information, optional photos, and an optional phone number to receive, review, and respond to consultations. All consultations are reviewed by a doctor; automated tools do not make diagnoses or treatment decisions.</p>
            <p>You can request deletion with the private long-term token in your status link at <Link className="font-semibold text-[var(--blue)] underline" href="/delete-data">Delete data</Link>. Cloud processing may involve overseas transfers. Exact countries and service regions are still being verified and must be disclosed before the consultation feature is launched. Statutory medical-record retention applicability is also under review; applicable law will take priority.</p>
            <p>Privacy contact: <a className="font-semibold text-[var(--blue)] underline" href="mailto:president@happydoctor.kr">president@happydoctor.kr</a></p>
          </div>
        </section>
      </div>
    </main>
  )
}
