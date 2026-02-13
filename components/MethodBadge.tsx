'use client';

import { cn } from '@/lib/cn';

const BADGE_STYLES: Record<string, string> = {
  GET: 'method-get',
  POST: 'method-post',
  PUT: 'method-put',
  PATCH: 'method-patch',
  DELETE: 'method-delete',
};

export default function MethodBadge({
  method,
  size = 'sm',
}: {
  method: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono font-bold rounded uppercase flex-shrink-0',
        BADGE_STYLES[method] ?? 'bg-surface-500 text-white',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5 min-w-[42px]' : 'text-xs px-2 py-1 min-w-[56px]',
      )}
    >
      {method}
    </span>
  );
}
