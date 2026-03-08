"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

export const LAB_TRIGGER_ARIA_LABEL = "LAB 반영";
export const LAB_TRIGGER_BUTTON_CLASS_NAME = "lab-trigger-button";
export const LAB_TRIGGER_DOC_BUTTON_CLASS_NAME = "dom-practice-trigger";
export const LAB_TRIGGER_ICON_CLASS_NAME = "lab-trigger__icon";

export const LAB_TRIGGER_ICON_STYLE: CSSProperties = {
  WebkitMaskImage: "url('/branding/options/lab-button-mark-braces-slash.svg')",
  maskImage: "url('/branding/options/lab-button-mark-braces-slash.svg')",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
};

type LabTriggerButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

interface CreateLabTriggerButtonOptions {
  parsed: Document;
  dataset: Record<string, string>;
  ariaLabel?: string;
  title?: string;
}

export function LabTriggerIcon() {
  return (
    <span
      aria-hidden="true"
      className={`${LAB_TRIGGER_ICON_CLASS_NAME} inline-block h-[17px] w-[25px] shrink-0 bg-current`}
      style={LAB_TRIGGER_ICON_STYLE}
    />
  );
}

export function LabTriggerButton({
  type = "button",
  className = "",
  title = LAB_TRIGGER_ARIA_LABEL,
  "aria-label": ariaLabel = LAB_TRIGGER_ARIA_LABEL,
  ...props
}: LabTriggerButtonProps) {
  const mergedClassName = [LAB_TRIGGER_BUTTON_CLASS_NAME, className].filter(Boolean).join(" ");

  return (
    <button type={type} className={mergedClassName} title={title} aria-label={ariaLabel} {...props}>
      <LabTriggerIcon />
    </button>
  );
}

export function createLabTriggerButton({
  parsed,
  dataset,
  ariaLabel = LAB_TRIGGER_ARIA_LABEL,
  title = LAB_TRIGGER_ARIA_LABEL,
}: CreateLabTriggerButtonOptions) {
  const triggerButton = parsed.createElement("button");

  triggerButton.type = "button";
  triggerButton.className = `${LAB_TRIGGER_BUTTON_CLASS_NAME} ${LAB_TRIGGER_DOC_BUTTON_CLASS_NAME}`;

  Object.entries(dataset).forEach(([key, value]) => {
    triggerButton.dataset[key] = value;
  });

  triggerButton.setAttribute("aria-label", ariaLabel);
  triggerButton.title = title;

  const icon = parsed.createElement("span");
  icon.className = LAB_TRIGGER_ICON_CLASS_NAME;
  icon.setAttribute("aria-hidden", "true");
  triggerButton.append(icon);

  return triggerButton;
}
