'use client';

import { Suspense, use } from 'react';
import { createHighlighter } from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

import { cn } from '#/lib/cn';

const highlighterPromise = createHighlighter({
  langs: ['json'],
  themes: ['slack-ochin', 'slack-dark'],
  engine: createJavaScriptRegexEngine(),
});

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
};

function CodeBlockFallback({ code, className }: Pick<CodeBlockProps, 'code' | 'className'>) {
  return (
    <pre
      data-slot="code-block"
      className={cn(
        'overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all',
        className,
      )}
    >
      {code}
    </pre>
  );
}

function CodeBlockHighlighted({ code, language = 'json', className }: CodeBlockProps) {
  const highlighter = use(highlighterPromise);
  const loadedLanguages = highlighter.getLoadedLanguages();
  const lang = loadedLanguages.includes(language) ? language : 'json';
  const html = highlighter.codeToHtml(code, {
    lang,
    themes: {
      light: 'slack-ochin',
      dark: 'slack-dark',
    },
    defaultColor: false,
  });

  return (
    <div
      data-slot="code-block"
      className={cn(
        'overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed',
        '[&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:font-mono',
        '[&_code]:font-mono [&_code]:text-xs [&_code]:leading-relaxed',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function CodeBlock(props: CodeBlockProps) {
  return (
    <Suspense fallback={<CodeBlockFallback code={props.code} className={props.className} />}>
      <CodeBlockHighlighted {...props} />
    </Suspense>
  );
}

export { CodeBlock };
export type { CodeBlockProps };
