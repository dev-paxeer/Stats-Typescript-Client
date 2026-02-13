'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import type { ResponseState } from '@/lib/types';
import { Clock, FileText, Copy, Check } from 'lucide-react';

interface ResponseViewerProps {
  response: ResponseState | null;
  loading: boolean;
  showHeaders?: boolean;
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\\"])*"(\s*:)?)/g,
      (match) => {
        if (match.endsWith(':')) {
          return `<span class="json-key">${match}</span>`;
        }
        return `<span class="json-string">${match}</span>`;
      },
    )
    .replace(/\b(-?\d+\.?\d*([eE][+-]?\d+)?)\b/g, '<span class="json-number">$1</span>')
    .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
    .replace(/\bnull\b/g, '<span class="json-null">null</span>');
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-emerald-400';
  if (status >= 300 && status < 400) return 'text-amber-400';
  if (status >= 400 && status < 500) return 'text-orange-400';
  return 'text-red-400';
}

function statusBg(status: number): string {
  if (status >= 200 && status < 300) return 'bg-emerald-500/10 border-emerald-500/20';
  if (status >= 300 && status < 400) return 'bg-amber-500/10 border-amber-500/20';
  if (status >= 400 && status < 500) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResponseViewer({ response, loading, showHeaders = true }: ResponseViewerProps) {
  const [tab, setTab] = useState<'body' | 'headers'>('body');
  const [copied, setCopied] = useState(false);

  const copyBody = () => {
    if (!response) return;
    navigator.clipboard.writeText(formatJson(response.body));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin-slow" />
          <span className="text-xs text-surface-400">Sending request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-surface-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-surface-400" />
          </div>
          <p className="text-xs text-surface-400">
            Send a request to see the response
          </p>
        </div>
      </div>
    );
  }

  const formattedBody = formatJson(response.body);

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-200">
        <span
          className={cn(
            'text-xs font-bold font-mono px-2 py-0.5 rounded border',
            statusBg(response.status),
            statusColor(response.status),
          )}
        >
          {response.status} {response.statusText}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-surface-400">
          <Clock className="w-3 h-3" />
          {response.duration}ms
        </div>
        <span className="text-[11px] text-surface-400">
          {formatBytes(response.size)}
        </span>
        <div className="ml-auto">
          <button
            onClick={copyBody}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-surface-200 px-4">
        <button
          onClick={() => setTab('body')}
          className={cn(
            'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
            tab === 'body'
              ? 'text-brand-500 border-brand-500'
              : 'text-surface-400 border-transparent hover:text-surface-600',
          )}
        >
          Body
        </button>
        {showHeaders && (
          <button
            onClick={() => setTab('headers')}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              tab === 'headers'
                ? 'text-brand-500 border-brand-500'
                : 'text-surface-400 border-transparent hover:text-surface-600',
            )}
          >
            Headers
            <span className="ml-1 text-[10px] text-surface-400">
              ({Object.keys(response.headers).length})
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {tab === 'body' ? (
          <pre
            className="code-block text-xs whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(formattedBody) }}
          />
        ) : (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, val]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="text-brand-400 font-mono font-medium flex-shrink-0">
                  {key}:
                </span>
                <span className="text-surface-600 font-mono break-all">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
