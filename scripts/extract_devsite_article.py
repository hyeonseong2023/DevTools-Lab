#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


class DevsiteArticleExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.capture_depth = 0
        self.output_parts: list[str] = []
        self.headings: list[dict[str, str]] = []
        self.current_heading: dict[str, Any] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        class_name = attr_map.get("class") or ""

        if self.capture_depth == 0 and tag == "div" and "devsite-article-body" in class_name:
            self.capture_depth = 1
            return

        if self.capture_depth == 0:
            return

        self.output_parts.append(self.get_starttag_text())
        self.capture_depth += 1

        if tag in {"h2", "h3"} and attr_map.get("id"):
            self.current_heading = {
                "tag": tag,
                "id": attr_map["id"],
                "depth": self.capture_depth,
                "text_parts": [],
            }

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if self.capture_depth == 0:
            return

        self.output_parts.append(self.get_starttag_text())

    def handle_endtag(self, tag: str) -> None:
        if self.capture_depth == 0:
            return

        if self.current_heading and self.current_heading["tag"] == tag and self.current_heading["depth"] == self.capture_depth:
            heading_text = unescape("".join(self.current_heading["text_parts"])).strip()
            if heading_text:
                self.headings.append(
                    {
                        "tag": self.current_heading["tag"],
                        "id": self.current_heading["id"],
                        "text": " ".join(heading_text.split()),
                    }
                )
            self.current_heading = None

        if self.capture_depth == 1:
            self.capture_depth = 0
            return

        self.output_parts.append(f"</{tag}>")
        self.capture_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.capture_depth == 0:
            return

        self.output_parts.append(data)

        if self.current_heading is not None:
            self.current_heading["text_parts"].append(data)

    def handle_entityref(self, name: str) -> None:
        if self.capture_depth == 0:
            return

        entity = f"&{name};"
        self.output_parts.append(entity)

        if self.current_heading is not None:
            self.current_heading["text_parts"].append(entity)

    def handle_charref(self, name: str) -> None:
        if self.capture_depth == 0:
            return

        entity = f"&#{name};"
        self.output_parts.append(entity)

        if self.current_heading is not None:
            self.current_heading["text_parts"].append(entity)

    def handle_comment(self, data: str) -> None:
        if self.capture_depth == 0:
            return

        self.output_parts.append(f"<!--{data}-->")


def fetch_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        },
    )
    with urlopen(request) as response:
        return response.read().decode("utf-8", errors="replace")


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract the inner HTML of a DevSite article body.")
    parser.add_argument("url", help="Full developer.chrome.com page URL")
    parser.add_argument("output", help="Path to save the extracted article HTML")
    parser.add_argument(
        "--headings-out",
        dest="headings_out",
        help="Optional JSON file path for extracted h2/h3 headings",
    )
    args = parser.parse_args()

    html = fetch_html(args.url)
    extractor = DevsiteArticleExtractor()
    extractor.feed(html)
    extractor.close()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("".join(extractor.output_parts).strip() + "\n", encoding="utf-8")

    if args.headings_out:
        headings_path = Path(args.headings_out)
        headings_path.parent.mkdir(parents=True, exist_ok=True)
        headings_path.write_text(
            json.dumps(extractor.headings, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
