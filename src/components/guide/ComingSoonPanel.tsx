import { DEVTOOLS_DOCS_MENU } from "@/lib/devtoolsDocsMenu";
import { PanelDefinition } from "@/lib/panels";
import Link from "next/link";

interface ComingSoonPanelProps {
  panel: PanelDefinition;
}

export function ComingSoonPanel({ panel }: ComingSoonPanelProps) {
  const docsGroup = DEVTOOLS_DOCS_MENU.find((group) => group.id === panel.slug);
  const docsItems = docsGroup?.sections.flatMap((section) => section.items) ?? [];

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-slate-500">{panel.name}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Guide In Progress
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Official docs linked
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              LAB planned
            </span>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          {panel.description} 현재는 공식 문서 구조를 기준으로 읽기 흐름, 핵심 개념, 실습 순서를 정리하는
          단계입니다. 실습 가능한 패널과 같은 톤으로 확장될 수 있도록 구조를 먼저 고정합니다.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Focus</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">핵심 개념 정리</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              패널의 목적과 주요 UI가 무엇을 보여주는지부터 정리합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Flow</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">조작 순서 설계</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              공식 문서 설명과 Preview LAB 인터랙션이 1:1로 연결되도록 설계합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Lab</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">정적 실습 준비</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-800">
                public/labs/{panel.slug}
              </code>{" "}
              기준으로 실습 화면을 연결합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="border-b border-slate-200 px-5 py-5 lg:border-b-0 lg:border-r lg:px-7 lg:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Planned Coverage
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              핵심 개념 설명: 이 패널이 무엇을 보여주는지
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              화면 읽는 법: 어떤 탭, 지표, 필터를 우선 봐야 하는지
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              조작 가이드: 어떤 순서로 실험하면 문제를 더 빨리 찾는지
            </li>
          </ul>
        </div>

        <aside className="px-5 py-5 lg:px-6 lg:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Official Reading
          </p>
          <div className="mt-4 space-y-2">
            {docsItems.length > 0 ? (
              docsItems.map((item) => {
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                    >
                      <span>{item.label}</span>
                      <span className="text-slate-400">↗</span>
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                  >
                    <span>{item.label}</span>
                    <span className="text-slate-400">→</span>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                연결된 공식 문서 목록을 준비 중입니다.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
