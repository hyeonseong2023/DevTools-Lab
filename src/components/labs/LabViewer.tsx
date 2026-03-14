"use client";

import { forwardRef } from "react";

interface LabViewerProps {
  title: string;
  showTitle?: boolean;
  src: string;
  instanceKey: number;
  onReloadRequest?: () => void;
  onPreviewDevtoolsRequest?: () => void;
  isPreviewDevtoolsOpen?: boolean;
  showOpenInNewTab?: boolean;
  containerClassName?: string;
  frameClassName?: string;
  flatRightCorners?: boolean;
  onFrameLoad?: () => void;
}

export const LabViewer = forwardRef<HTMLIFrameElement, LabViewerProps>(
  function LabViewer(
    {
      title,
      showTitle = true,
      src,
      instanceKey,
      onReloadRequest,
      onPreviewDevtoolsRequest,
      isPreviewDevtoolsOpen = false,
      showOpenInNewTab = false,
      containerClassName = "",
      frameClassName = "h-[620px] lg:h-[760px]",
      flatRightCorners = false,
      onFrameLoad,
    },
    ref,
  ) {
    const sectionCornerClass = flatRightCorners ? "rounded-l-2xl rounded-r-none" : "rounded-2xl";
    const frameCornerClass = flatRightCorners ? "rounded-bl-2xl rounded-br-none" : "rounded-b-2xl";
    const toolButtonClassName =
      "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition duration-200";
    const subtleButtonClassName = `${toolButtonClassName} border-slate-300 bg-white text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:-translate-y-px hover:bg-slate-50 hover:text-slate-950`;

    return (
      <section
        className={`${sectionCornerClass} ${containerClassName} flex flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]`}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 text-base font-semibold uppercase tracking-[0.16em] text-slate-500">
              <svg
                className="h-[18px] w-[18px] shrink-0"
                focusable="false"
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 960 960"
              >
                <path
                  transform="translate(0 960)"
                  fill="currentColor"
                  d="M209-120q-42 0-70.5-28.5T110-217q0-14 3-25.5t9-21.5l228-341q10-14 15-31t5-34v-110h-20q-13 0-21.5-8.5T320-810q0-13 8.5-21.5T350-840h260q13 0 21.5 8.5T640-810q0 13-8.5 21.5T610-780h-20v110q0 17 5 34t15 31l227 341q6 9 9.5 20.5T850-217q0 41-28 69t-69 28H209Zm221-660v110q0 26-7.5 50.5T401-573L276-385q-6 8-8.5 16t-2.5 16q0 23 17 39.5t42 16.5q28 0 56-12t80-47q69-45 103.5-62.5T633-443q4-1 5.5-4.5t-.5-7.5l-78-117q-15-21-22.5-46t-7.5-52v-110H430Z"
                />
              </svg>
              LAB
            </p>
            {showTitle ? <p className="mt-1 text-sm font-medium text-slate-900">{title}</p> : null}
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {onPreviewDevtoolsRequest ? (
              <button
                type="button"
                onClick={onPreviewDevtoolsRequest}
                className={`${toolButtonClassName} border-slate-900 bg-slate-900 text-white hover:-translate-y-px hover:bg-slate-800`}
              >
                {isPreviewDevtoolsOpen ? "DevTools 닫기" : "DevTools 열기"}
              </button>
            ) : null}
            {onReloadRequest ? (
              <button
                type="button"
                onClick={onReloadRequest}
                className={subtleButtonClassName}
              >
                새로고침
              </button>
            ) : null}
            {showOpenInNewTab ? (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className={subtleButtonClassName}
              >
                새 탭
              </a>
            ) : null}
          </div>
        </div>

        <iframe
          key={instanceKey}
          ref={ref}
          title={title}
          src={src}
          sandbox="allow-scripts allow-same-origin"
          className={`${frameClassName} ${frameCornerClass} w-full border-0 bg-white opacity-0 transition duration-200`}
          onLoad={(event) => {
            event.currentTarget.style.opacity = "1";
            onFrameLoad?.();
          }}
        />
      </section>
    );
  },
);
