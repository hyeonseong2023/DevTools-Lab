import { PANEL_DEFINITIONS } from "@/lib/panels";
import Link from "next/link";

const weekOneChecklist = [
  "기본 레이아웃(Header + Sidebar) 구성",
  "8개 패널 라우팅 생성",
  "모든 패널의 Coming Soon 화면 통일",
  "public/labs 폴더 구조 초기화",
  "배포 준비를 위한 기본 설정 완료",
];

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Week 1
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          기본 구조와 라우팅 구축 완료
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          DevTools-Lab의 1주차 목표인 문서 기반 설계 반영, 기본 레이아웃,
          패널 라우팅, 실습 폴더 초기화를 진행한 상태입니다.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">1주차 체크리스트</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {weekOneChecklist.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">패널 바로가기</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PANEL_DEFINITIONS.map((panel) => (
            <Link
              key={panel.slug}
              href={`/${panel.slug}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100"
            >
              <p className="text-sm font-semibold text-slate-900">{panel.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {panel.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
