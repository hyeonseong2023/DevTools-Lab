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

    return (
      <section
        className={`${sectionCornerClass} ${containerClassName} flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Preview Lab
            </p>
            {showTitle ? <p className="text-sm font-medium text-slate-900">{title}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            {onPreviewDevtoolsRequest ? (
              <button
                type="button"
                onClick={onPreviewDevtoolsRequest}
                className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
              >
                {isPreviewDevtoolsOpen ? "DevTools 닫기" : "DevTools 열기"}
              </button>
            ) : null}
            {onReloadRequest ? (
              <button
                type="button"
                onClick={onReloadRequest}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Preview 새로고침
              </button>
            ) : null}
            {showOpenInNewTab ? (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
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
          className={`${frameClassName} ${frameCornerClass} w-full border-0 bg-white`}
          onLoad={onFrameLoad}
        />
      </section>
    );
  },
);
