"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface HeroBanner {
  id:
    | "elements"
    | "console"
    | "sources"
    | "network"
    | "performance"
    | "memory"
    | "application"
    | "security"
    | "lighthouse";
  image: string;
  href: string;
  label: string;
  comment: string;
}

const HERO_BANNERS: HeroBanner[] = [
  {
    id: "elements",
    image: "/home-banners-tight/elements.png",
    href: "/elements",
    label: "Elements",
    comment: "DOM 및 CSS를 보고 변경합니다.",
  },
  {
    id: "console",
    image: "/home-banners-tight/console.png",
    href: "/console",
    label: "Console",
    comment: "콘솔에서 메시지를 보고 JavaScript를 실행합니다.",
  },
  {
    id: "sources",
    image: "/home-banners-tight/sources.png",
    href: "/sources",
    label: "Sources",
    comment: "자바스크립트를 디버그하고 변경사항을 관리합니다.",
  },
  {
    id: "network",
    image: "/home-banners-tight/network.png",
    href: "/network",
    label: "Network",
    comment: "네트워크 활동을 보고 디버그합니다.",
  },
  {
    id: "performance",
    image: "/home-banners-tight/performance.png",
    href: "/performance",
    label: "Performance",
    comment: "부하 및 런타임 성능을 개선할 방법을 찾습니다.",
  },
  {
    id: "memory",
    image: "/home-banners-tight/memory.png",
    href: "/memory",
    label: "Memory",
    comment: "메모리 누수 등 메모리 문제를 찾아 해결합니다.",
  },
  {
    id: "application",
    image: "/home-banners-tight/application.png",
    href: "/application",
    label: "Application",
    comment: "스토리지, 쿠키, 캐시 등 로드된 리소스를 검사합니다.",
  },
  {
    id: "security",
    image: "/home-banners-tight/security.png",
    href: "/security",
    label: "Security",
    comment: "혼합 콘텐츠 문제, 인증서 문제 등을 디버그합니다",
  },
  {
    id: "lighthouse",
    image: "/home-banners-tight/performance.png",
    href: "/lighthouse",
    label: "Lighthouse",
    comment: "Lighthouse 리포트로 성능, 접근성, SEO를 점검합니다.",
  },
];

export function HomeOverviewHero() {
  const SWIPE_TRIGGER_PX = 48;
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isPanelListOpen, setIsPanelListOpen] = useState(false);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);
  const activeBanner = HERO_BANNERS[activeBannerIndex];

  const goPrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
  };

  const goNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % HERO_BANNERS.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 4600);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!isPanelListOpen) {
      return;
    }

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) {
        setIsPanelListOpen(false);
        return;
      }

      if (event.target.closest("[data-panel-list-root='true']")) {
        return;
      }

      setIsPanelListOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [isPanelListOpen]);

  const isNoDragTarget = (target: EventTarget | null) => {
    return target instanceof HTMLElement && target.closest("[data-no-drag='true']") !== null;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (isNoDragTarget(event.target)) {
      return;
    }

    pointerStartXRef.current = event.clientX;
    pointerStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerStartXRef.current === null || pointerStartYRef.current === null) {
      return;
    }

    const dx = event.clientX - pointerStartXRef.current;
    const dy = event.clientY - pointerStartYRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    pointerStartXRef.current = null;
    pointerStartYRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (absDx >= SWIPE_TRIGGER_PX && absDx > absDy) {
      if (dx > 0) {
        goPrevBanner();
      } else {
        goNextBanner();
      }
    }
  };

  const handlePointerCancel = () => {
    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
  };

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-white sm:h-screen sm:bg-transparent"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="absolute inset-0 hidden sm:block">
        {HERO_BANNERS.map((banner, index) => (
          <img
            key={banner.id}
            src={banner.image}
            alt=""
            aria-hidden="true"
            className={`absolute left-0 top-0 h-full w-auto max-w-none transition-opacity duration-[900ms] ease-out ${
              index === activeBannerIndex ? "opacity-100" : "opacity-0"
            }`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>

      <div className="absolute inset-0 sm:hidden">
        <div className="absolute -left-16 top-14 h-40 w-40 rounded-full bg-sky-100/80 blur-3xl" />
        <div className="absolute right-[-2rem] top-28 h-48 w-48 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="absolute bottom-24 left-6 h-36 w-36 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_46%,#ffffff_100%)]" />
      </div>

      <div className="absolute inset-y-0 right-0 hidden w-[40%] bg-white sm:block" />
      <div className="absolute inset-y-0 right-[40%] hidden w-[19%] bg-gradient-to-l from-white to-transparent sm:block" />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-4 pb-5 pt-5 sm:hidden">
        <div className="flex items-center justify-end">
          <Link
            href="/about/environment"
            className="inline-flex items-center whitespace-nowrap px-0.5 py-1 text-base font-semibold text-slate-500 transition hover:text-slate-800"
            data-no-drag="true"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            ABOUT
          </Link>
        </div>

        <div className="mt-10 rounded-[28px] border border-white/70 bg-white/86 p-4 text-right text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.1)] backdrop-blur-md">
          <p className="text-sm font-semibold tracking-[0.08em] text-slate-600">
            크롬 개발자도구 가이드
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-[1.05] tracking-tight text-slate-950">
            Chrome DevTools Guide
          </h1>
          <p className="mt-3 ml-auto max-w-[28ch] text-right text-[13px] leading-6 text-slate-700">
            Chrome DevTools 공식 Overview 구조를 기준으로 직접 체험하며 이해할 수 있도록 구성한
            가이드입니다.
          </p>
        </div>

        <div className="mt-5 rounded-[26px] border border-slate-200 bg-white/92 p-2 shadow-[0_20px_48px_rgba(15,23,42,0.14)] backdrop-blur-md">
          <Link
            href={activeBanner.href}
            data-no-drag="true"
            onClick={(event) => {
              event.stopPropagation();
            }}
            className="group block overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50"
          >
            <img
              src={activeBanner.image}
              alt={`${activeBanner.label} 패널 미리보기`}
              className="h-[250px] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
              loading="eager"
            />
          </Link>
        </div>

        <div className="mt-4 rounded-[26px] border border-slate-200 bg-white/96 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 text-slate-500">
            <div className="text-sm font-semibold tracking-[0.1em]">
              {activeBannerIndex + 1} / {HERO_BANNERS.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="이전 배너"
                data-no-drag="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                onClick={(event) => {
                  event.stopPropagation();
                  goPrevBanner();
                }}
              >
                ◀
              </button>
              <button
                type="button"
                aria-label="다음 배너"
                data-no-drag="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                onClick={(event) => {
                  event.stopPropagation();
                  goNextBanner();
                }}
              >
                ▶
              </button>
            </div>
          </div>

          <Link
            href={activeBanner.href}
            data-no-drag="true"
            onClick={(event) => {
              event.stopPropagation();
            }}
            className="group mt-4 inline-flex w-fit items-center justify-end gap-2 text-[2rem] font-semibold leading-tight text-slate-900 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <span className="border-b-2 border-transparent transition-colors group-hover:border-slate-900">
              {activeBanner.label}
            </span>
            <span
              aria-hidden="true"
              className="inline-block scale-x-75 scale-y-125 text-lg text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-800"
            >
              {">"}
            </span>
          </Link>
          <p className="mt-2 text-sm leading-6 text-slate-700">{activeBanner.comment}</p>

          <div className="mt-4 -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HERO_BANNERS.map((panel, index) => (
              <Link
                key={`${panel.id}-mobile-chip`}
                href={panel.href}
                data-no-drag="true"
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] transition ${
                  index === activeBannerIndex
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {panel.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 hidden h-full sm:block">
        <div className="absolute right-5 top-5 sm:right-6 sm:top-6">
          <Link
            href="/about/environment"
            className="inline-flex items-center whitespace-nowrap px-0.5 py-1 text-base font-semibold text-slate-500 transition hover:text-slate-800"
            data-no-drag="true"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            ABOUT
          </Link>
        </div>
        <div className="flex h-full items-start px-4 pt-20 sm:justify-end sm:px-10 sm:pt-[18vh] lg:px-14 lg:pt-[20vh]">
          <div className="ml-auto w-full max-w-[92vw] text-right text-slate-900 sm:max-w-[620px]">
            <p className="text-[16px] font-semibold tracking-[0.08em] text-slate-600 sm:text-[26px]">
              크롬 개발자도구 가이드
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:mt-4 sm:text-5xl lg:text-6xl">
              Chrome DevTools Guide
            </h1>
            <p className="mt-3 ml-auto max-w-[52ch] text-right text-[13px] leading-6 text-slate-700 sm:mt-5 sm:text-base sm:leading-7">
              Chrome DevTools 공식 Overview 구조를 기준으로
              <br />
              직접 체험하며 이해할 수 있도록 구성한 가이드입니다.
            </p>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 w-full max-w-[82vw] text-right text-slate-800 sm:bottom-8 sm:right-8 sm:max-w-[46ch]">
          <div className="relative min-h-[130px] sm:min-h-[176px]">
            {HERO_BANNERS.map((banner, index) => (
              <div
                key={`${banner.id}-meta`}
                className={`absolute inset-0 transition-opacity duration-[700ms] ease-out ${
                  index === activeBannerIndex ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <div className="flex items-center justify-end text-slate-500">
                  <div className="relative inline-flex items-center gap-2" data-panel-list-root="true">
                    <div
                      className={`absolute bottom-full right-0 mb-3 w-full origin-bottom-right rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 ease-out ${
                        isPanelListOpen && index === activeBannerIndex
                          ? "translate-y-0 scale-100 opacity-100"
                          : "pointer-events-none translate-y-1 scale-95 opacity-0"
                      }`}
                      data-no-drag="true"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <ul className="space-y-1 text-left">
                        {HERO_BANNERS.map((panel, panelIndex) => (
                          <li key={`${panel.id}-quick-link`}>
                            <Link
                              href={panel.href}
                              data-no-drag="true"
                              onClick={(event) => {
                                event.stopPropagation();
                                setIsPanelListOpen(false);
                              }}
                              className={`block rounded-md px-2 py-1 text-sm transition hover:bg-slate-100 hover:text-slate-900 ${
                                panelIndex === activeBannerIndex ? "bg-slate-100 text-slate-900" : "text-slate-700"
                              }`}
                            >
                              {panel.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      data-no-drag="true"
                      className="cursor-pointer text-[13px] font-semibold tracking-[0.1em] underline decoration-1 underline-offset-4 transition hover:text-slate-700 sm:text-base"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsPanelListOpen((prev) => !prev);
                      }}
                    >
                      전체 보기
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="이전 배너"
                        data-no-drag="true"
                        className="h-8 w-8 cursor-pointer text-base font-semibold transition hover:text-slate-800 sm:text-lg"
                        onClick={(event) => {
                          event.stopPropagation();
                          goPrevBanner();
                        }}
                      >
                        ◀
                      </button>
                      <p className="text-sm font-semibold tracking-[0.1em] sm:text-lg">
                        {index + 1} / {HERO_BANNERS.length}
                      </p>
                      <button
                        type="button"
                        aria-label="다음 배너"
                        data-no-drag="true"
                        className="h-8 w-8 cursor-pointer text-base font-semibold transition hover:text-slate-800 sm:text-lg"
                        onClick={(event) => {
                          event.stopPropagation();
                          goNextBanner();
                        }}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>
                <Link
                  href={banner.href}
                  data-no-drag="true"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                  className="group mt-1 ml-auto inline-flex w-fit items-center justify-end gap-2 text-3xl font-semibold leading-tight text-slate-900 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:text-5xl"
                >
                  <span className="border-b-2 border-transparent transition-colors group-hover:border-slate-900">
                    {banner.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-block scale-x-75 scale-y-125 text-xl text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-800 sm:text-2xl"
                  >
                    {">"}
                  </span>
                </Link>
                <p className="mt-1 whitespace-normal text-sm leading-6 text-slate-700 sm:mt-2 sm:whitespace-nowrap sm:text-lg sm:leading-9">
                  {banner.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
