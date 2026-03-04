import { PanelDefinition } from "@/lib/panels";

interface ComingSoonPanelProps {
  panel: PanelDefinition;
}

export function ComingSoonPanel({ panel }: ComingSoonPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-slate-600">{panel.name}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        학습 문서 준비 중
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        {panel.description} 이 항목은 공식 문서처럼 개념 설명과 화면 읽는 법을 먼저
        안내하고, 그다음 보조 실습으로 이해를 확인하는 구조로 제공됩니다.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          이 항목에서 다룰 내용
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>핵심 개념 설명: 이 항목이 무엇을 보여주는지</li>
          <li>화면 읽는 법: 어떤 탭/영역/지표를 봐야 하는지</li>
          <li>조작 가이드: 어떤 순서로 기능을 사용하면 되는지</li>
          <li>
            <code className="rounded bg-slate-200 px-1 py-0.5 text-xs text-slate-800">
              public/labs/{panel.slug}
            </code>{" "}
            보조 실습 화면으로 개념 확인
          </li>
        </ul>
      </div>
    </section>
  );
}
