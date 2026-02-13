'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import type { ParsedEndpoint, SpecTag } from '@/lib/types';
import type { PlaygroundConfig } from '@/playground.config';
import {
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  config: PlaygroundConfig;
  groups: { tag: SpecTag; endpoints: ParsedEndpoint[] }[];
  selectedEndpoint: ParsedEndpoint | null;
  onSelect: (ep: ParsedEndpoint) => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  PATCH: 'text-violet-400',
  DELETE: 'text-red-400',
};

export default function Sidebar({
  config,
  groups,
  selectedEndpoint,
  onSelect,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      endpoints: g.endpoints.filter(
        (ep) =>
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          (ep.summary ?? '').toLowerCase().includes(search.toLowerCase()) ||
          ep.operationId.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((g) => g.endpoints.length > 0);

  const toggleGroup = (name: string) =>
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <aside className="w-72 flex-shrink-0 border-r border-surface-200 bg-surface-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-200">
        <div className="flex items-center gap-2.5 mb-1">
          {config.logo ? (
            <img src={config.logo} alt="" className="w-7 h-7 rounded" />
          ) : (
            <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-semibold text-surface-900 leading-tight">
              {config.name}
            </h1>
            {config.description && (
              <p className="text-[11px] text-surface-500 leading-tight">
                {config.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-surface-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-md text-surface-900 placeholder:text-surface-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Endpoint list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {filteredGroups.map(({ tag, endpoints }) => (
          <div key={tag.name} className="mb-1">
            <button
              onClick={() => toggleGroup(tag.name)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-surface-500 uppercase tracking-wider hover:text-surface-700 transition-colors"
            >
              {collapsed[tag.name] ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {tag.name}
              <span className="ml-auto text-surface-400 font-normal normal-case tracking-normal">
                {endpoints.length}
              </span>
            </button>

            {!collapsed[tag.name] && (
              <div className="space-y-px">
                {endpoints.map((ep) => {
                  const isSelected =
                    selectedEndpoint?.operationId === ep.operationId;
                  return (
                    <button
                      key={ep.operationId}
                      onClick={() => onSelect(ep)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors group',
                        isSelected
                          ? 'bg-brand-600/10 border-r-2 border-brand-500'
                          : 'hover:bg-surface-100',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-bold w-12 flex-shrink-0 font-mono',
                          METHOD_COLORS[ep.method] ?? 'text-surface-500',
                        )}
                      >
                        {ep.method}
                      </span>
                      <span
                        className={cn(
                          'text-xs truncate',
                          isSelected
                            ? 'text-surface-900 font-medium'
                            : 'text-surface-600 group-hover:text-surface-800',
                        )}
                      >
                        {ep.summary ?? ep.path}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-surface-400">
            No endpoints found
          </div>
        )}
      </nav>

      {/* Footer links */}
      {config.links && config.links.length > 0 && (
        <div className="border-t border-surface-200 p-3 space-y-1">
          {config.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1 text-xs text-surface-500 hover:text-surface-700 transition-colors rounded hover:bg-surface-100"
            >
              <ExternalLink className="w-3 h-3" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}
