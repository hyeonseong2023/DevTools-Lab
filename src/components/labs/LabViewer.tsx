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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
