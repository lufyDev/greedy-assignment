"use client";

import type { TextMessagePartComponent } from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Assistant text rendered as Markdown. react-markdown escapes raw HTML (no
 * rehype-raw) and sanitises link URLs, so model output cannot inject markup.
 */
export const MarkdownText: TextMessagePartComponent = ({ text, status }) => {
  if (text === "" && status.type === "running") return <TypingIndicator />;
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      skipHtml
      className="aui-md space-y-2 text-sm leading-relaxed [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc"
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer noopener">
            {children}
          </a>
        ),
      }}
    />
  );
};

export function TypingIndicator({ label = "Checking the Sea View page…" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="flex gap-1" aria-hidden>
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="size-1.5 animate-bounce rounded-full bg-sunset" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      {label}
    </span>
  );
}
