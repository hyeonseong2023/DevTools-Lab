import { PanelDefinition } from "@/lib/panels";

interface ComingSoonPanelProps {
  panel: PanelDefinition;
}

export function ComingSoonPanel({ panel }: ComingSoonPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-slate-600">{panel.name} Panel</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Coming Soon
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        {panel.description} 이 페이지는 1주차 범위에서 라우팅과 기본 UI 골격만
        먼저 준비된 상태입니다.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          다음 구현 예정
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>패널 전용 실습 시나리오 작성</li>
          <li>
            <code className="rounded bg-slate-200 px-1 py-0.5 text-xs text-slate-800">
              public/labs/{panel.slug}
            </code>{" "}
            실습 파일과 iframe 연동
          </li>
          <li>단계별 가이드/체크리스트 UI 연결</li>
        </ul>
      </div>
    </section>
  );
}
