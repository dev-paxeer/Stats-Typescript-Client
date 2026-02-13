'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import type { ParsedParameter } from '@/lib/types';

interface ParameterInputProps {
  param: ParsedParameter;
  value: string;
  onChange: (value: string) => void;
}

export default function ParameterInput({ param, value, onChange }: ParameterInputProps) {
  const schema = param.schema;
  const hasEnum = schema.enum && schema.enum.length > 0;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-36 flex-shrink-0 pt-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-surface-800 font-mono">
            {param.name}
          </span>
          {param.required && (
            <span className="text-[10px] text-red-400 font-medium">*</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-surface-400 font-mono">
            {schema.type ?? 'string'}
          </span>
          <span className="text-[10px] text-surface-300">·</span>
          <span className="text-[10px] text-surface-400">{param.in}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {hasEnum ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-md text-surface-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          >
            <option value="">— select —</option>
            {schema.enum!.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={schema.type === 'integer' || schema.type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              param.description ??
              (schema.default !== undefined ? String(schema.default) : `Enter ${param.name}...`)
            }
            className="w-full px-2.5 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-md text-surface-900 placeholder:text-surface-400 font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
        )}
        {param.description && (
          <p className="mt-1 text-[11px] text-surface-400 leading-snug">
            {param.description}
          </p>
        )}
      </div>
    </div>
  );
}
