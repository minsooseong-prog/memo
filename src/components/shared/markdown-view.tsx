import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * 안전한 마크다운 렌더링
 * - skipHtml: 본문 속 HTML 태그는 렌더링하지 않음(XSS 방지)
 * - react-markdown 기본 urlTransform 이 javascript: 등 위험한 링크를 제거
 * - 이미지는 외부 추적을 막기 위해 링크로만 표시
 */
export function MarkdownView({ content, serif = false, className }: { content: string; serif?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-pre:bg-muted prose-pre:text-foreground",
        serif && "font-serif prose-p:leading-8",
        className,
      )}
    >
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer nofollow" />,
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              <a href={src} target="_blank" rel="noopener noreferrer nofollow">
                {alt || "이미지 링크"}
              </a>
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
