'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { Copy, Check } from 'lucide-react';
import type { ParsedEndpoint, RequestState } from '@/lib/types';
import { generateCurl, generateJavaScript, generatePython } from '@/lib/code-generator';

type Lang = 'curl' | 'javascript' | 'python';

interface CodeSnippetsProps {
  baseUrl: string;
  endpoint: ParsedEndpoint;
  requestState: RequestState;
  languages?: Lang[];
}

const LANG_LABELS: Record<Lang, string> = {
  curl: 'cURL',
  javascript: 'JavaScript',
  python: 'Python',
};

export default function CodeSnippets({
  baseUrl,
  endpoint,
  requestState,
  languages = ['curl', 'javascript', 'python'],
}: CodeSnippetsProps) {
  const [activeLang, setActiveLang] = useState<Lang>(languages[0] ?? 'curl');
  const [copied, setCopied] = useState(false);

  const generators: Record<Lang, () => string> = {
    curl: () => generateCurl(baseUrl, endpoint, requestState),
    javascript: () => generateJavaScript(baseUrl, endpoint, requestState),
    python: () => generatePython(baseUrl, endpoint, requestState),
  };

  const code = generators[activeLang]?.() ?? '';

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-surface-200 rounded-lg overflow-hidden">
      {/* Language tabs */}
      <div className="flex items-center justify-between bg-surface-50 border-b border-surface-200 px-1">
        <div className="flex items-center">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={cn(
                'px-3 py-2 text-[11px] font-medium transition-colors border-b-2',
                activeLang === lang
                  ? 'text-brand-500 border-brand-500'
                  : 'text-surface-400 border-transparent hover:text-surface-600',
              )}
            >
              {LANG_LABELS[lang]}
            </button>
          ))}
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-2 py-1 mr-1 text-[11px] text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <pre className="p-4 overflow-auto max-h-64 bg-surface-0">
        <code className="code-block text-xs text-surface-700 whitespace-pre-wrap break-all">
          {code}
        </code>
      </pre>
    </div>
  );
}
