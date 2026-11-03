import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const MARKDOWN_CLASS =
  "aui-md space-y-2 text-sm leading-relaxed wrap-anywhere [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc";

export function MarkdownLink({ href, children }: ComponentProps<"a">) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

/**
 * Renders model text as Markdown. Raw HTML is dropped and link URLs are
 * sanitised by react-markdown, so model output cannot inject markup.
 */
export function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className={MARKDOWN_CLASS}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ a: MarkdownLink }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
