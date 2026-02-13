'use client';

import React, { useState } from 'react';
import type { ParsedEndpoint, SpecTag } from '@/lib/types';
import type { PlaygroundConfig } from '@/playground.config';
import Sidebar from '@/components/Sidebar';
import EndpointPanel from '@/components/EndpointPanel';

interface PlaygroundClientProps {
  config: PlaygroundConfig;
  groups: { tag: SpecTag; endpoints: ParsedEndpoint[] }[];
  endpoints: ParsedEndpoint[];
}

export default function PlaygroundClient({ config, groups, endpoints }: PlaygroundClientProps) {
  const [selected, setSelected] = useState<ParsedEndpoint | null>(endpoints[0] ?? null);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        config={config}
        groups={groups}
        selectedEndpoint={selected}
        onSelect={setSelected}
      />
      {selected ? (
        <EndpointPanel endpoint={selected} config={config} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-surface-400">
          Select an endpoint to get started
        </div>
      )}
    </div>
  );
}
