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
    | "recorder"
    | "performance"
    | "memory"
    | "application"
    | "security";
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
    id: "recorder",
    image: "/home-banners-tight/recorder.png",
    href: "/recorder",
    label: "Recorder",
    comment: "사용자 플로우를 녹화, 재생, 측정합니다.",
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
];

export function HomeOverviewHero() {
  const SWIPE_TRIGGER_PX = 48;
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isPanelListOpen, setIsPanelListOpen] = useState(false);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);

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
      className="relative h-screen overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="absolute inset-0">
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

      <div className="absolute inset-y-0 right-0 hidden w-[40%] bg-white sm:block" />
      <div className="absolute inset-y-0 right-[40%] hidden w-[19%] bg-gradient-to-l from-white to-transparent sm:block" />
      <div className="absolute inset-x-0 bottom-0 h-[52%] bg-white sm:hidden" />
      <div className="absolute inset-x-0 bottom-[52%] h-[16%] bg-gradient-to-t from-white to-transparent sm:hidden" />

      <div className="relative z-10 h-full">
        <div className="absolute right-5 top-5 sm:right-6 sm:top-6">
          <Link
            href="/about/environment"
            className="text-base font-medium text-slate-800 transition hover:text-slate-950"
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
