'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/cn';
import type { ParsedEndpoint, RequestState, ResponseState } from '@/lib/types';
import type { PlaygroundConfig } from '@/playground.config';
import { buildUrl } from '@/lib/code-generator';
import { buildSampleBody } from '@/lib/openapi-parser';
import MethodBadge from './MethodBadge';
import ParameterInput from './ParameterInput';
import ResponseViewer from './ResponseViewer';
import CodeSnippets from './CodeSnippets';
import { Send, Code2, ChevronDown, ChevronRight, Key, AlertTriangle } from 'lucide-react';

interface EndpointPanelProps {
  endpoint: ParsedEndpoint;
  config: PlaygroundConfig;
}

export default function EndpointPanel({ endpoint, config }: EndpointPanelProps) {
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path');
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  const headerParams = endpoint.parameters.filter((p) => p.in === 'header');

  const defaultBody = useMemo(() => {
    if (!endpoint.requestBody?.schema) return '';
    return JSON.stringify(buildSampleBody(endpoint.requestBody.schema), null, 2);
  }, [endpoint]);

  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [headerValues, setHeaderValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState(defaultBody);
  const [authToken, setAuthToken] = useState('');
  const [authType, setAuthType] = useState<'bearer' | 'apiKey' | 'basic' | 'none'>(
    config.auth?.type ?? 'bearer',
  );

  const [response, setResponse] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Reset state when endpoint changes
  React.useEffect(() => {
    setPathValues({});
    setQueryValues({});
    setHeaderValues({});
    setBody(defaultBody);
    setResponse(null);
    setLoading(false);
    setShowSnippets(false);
  }, [endpoint.operationId, defaultBody]);

  const requestState: RequestState = useMemo(
    () => ({
      pathParams: pathValues,
      queryParams: queryValues,
      headerParams: headerValues,
      body,
      authToken,
      authType,
    }),
    [pathValues, queryValues, headerValues, body, authToken, authType],
  );

  const fullUrl = useMemo(
    () => buildUrl(config.baseUrl, endpoint, requestState),
    [config.baseUrl, endpoint, requestState],
  );

  const sendRequest = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        if (authType === 'bearer') headers['Authorization'] = `Bearer ${authToken}`;
        else if (authType === 'apiKey') headers[config.auth?.headerName ?? 'X-API-Key'] = authToken;
      }
      if (endpoint.requestBody && body) {
        headers['Content-Type'] = 'application/json';
      }
      for (const [k, v] of Object.entries(headerValues)) {
        if (v) headers[k] = v;
      }

      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers,
      };
      if (endpoint.requestBody && body && endpoint.method !== 'GET') {
        fetchOptions.body = body;
      }

      const res = await fetch(fullUrl, fetchOptions);
      const duration = Math.round(performance.now() - start);
      const text = await res.text();

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: text,
        duration,
        size: new Blob([text]).size,
      });
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: JSON.stringify({ error: err.message ?? 'Request failed' }, null, 2),
        duration,
        size: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [fullUrl, endpoint, body, authToken, authType, headerValues, config.auth?.headerName]);

  const successResponse = endpoint.responses.find(
    (r) => r.statusCode.startsWith('2'),
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50 px-6 py-4">
        <div className="flex items-center gap-3 mb-1">
          <MethodBadge method={endpoint.method} size="md" />
          <code className="text-sm font-mono font-medium text-surface-800">
            {endpoint.path}
          </code>
          {endpoint.deprecated && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" />
              Deprecated
            </span>
          )}
        </div>
        {endpoint.summary && (
          <h2 className="text-lg font-semibold text-surface-900 mt-1">
            {endpoint.summary}
          </h2>
        )}
        {endpoint.description && (
          <p className="text-xs text-surface-500 mt-1 max-w-2xl leading-relaxed">
            {endpoint.description}
          </p>
        )}
      </div>

      {/* Main content — split view */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Request builder */}
        <div className="flex-1 overflow-y-auto border-r border-surface-200">
          <div className="p-6 space-y-6">
            {/* URL bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-surface-100 border border-surface-200 rounded-lg overflow-hidden">
                <span className="px-3 py-2 text-xs font-medium text-surface-500 bg-surface-50 border-r border-surface-200 flex-shrink-0">
                  {endpoint.method}
                </span>
                <code className="flex-1 px-3 py-2 text-xs font-mono text-surface-700 truncate">
                  {fullUrl}
                </code>
              </div>
              <button
                onClick={sendRequest}
                disabled={loading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all',
                  loading
                    ? 'bg-surface-200 text-surface-400 cursor-not-allowed'
                    : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98] shadow-sm shadow-brand-600/25',
                )}
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>

            {/* Auth toggle */}
            <div>
              <button
                onClick={() => setShowAuth(!showAuth)}
                className="flex items-center gap-2 text-xs font-medium text-surface-600 hover:text-surface-800 transition-colors"
              >
                {showAuth ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Key className="w-3.5 h-3.5" />
                Authentication
                {authToken && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
              {showAuth && (
                <div className="mt-3 p-3 bg-surface-50 border border-surface-200 rounded-lg space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <select
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value as any)}
                      className="px-2 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-md text-surface-700 focus:outline-none focus:border-brand-500"
                    >
                      <option value="bearer">Bearer Token</option>
                      <option value="apiKey">API Key</option>
                      <option value="none">None</option>
                    </select>
                    {authType !== 'none' && (
                      <input
                        type="text"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder={config.auth?.placeholder ?? 'Enter token...'}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-md text-surface-900 placeholder:text-surface-400 font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Path parameters */}
            {pathParams.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                  Path Parameters
                </h3>
                <div className="divide-y divide-surface-100">
                  {pathParams.map((p) => (
                    <ParameterInput
                      key={p.name}
                      param={p}
                      value={pathValues[p.name] ?? ''}
                      onChange={(v) => setPathValues((prev) => ({ ...prev, [p.name]: v }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Query parameters */}
            {queryParams.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                  Query Parameters
                </h3>
                <div className="divide-y divide-surface-100">
                  {queryParams.map((p) => (
                    <ParameterInput
                      key={p.name}
                      param={p}
                      value={queryValues[p.name] ?? ''}
                      onChange={(v) => setQueryValues((prev) => ({ ...prev, [p.name]: v }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Header parameters */}
            {headerParams.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                  Header Parameters
                </h3>
                <div className="divide-y divide-surface-100">
                  {headerParams.map((p) => (
                    <ParameterInput
                      key={p.name}
                      param={p}
                      value={headerValues[p.name] ?? ''}
                      onChange={(v) => setHeaderValues((prev) => ({ ...prev, [p.name]: v }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Request body */}
            {endpoint.requestBody && (
              <div>
                <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                  Request Body
                  <span className="ml-2 font-normal normal-case text-surface-400">
                    {endpoint.requestBody.contentType}
                  </span>
                </h3>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={Math.min(Math.max(body.split('\n').length, 4), 16)}
                  className="w-full px-3 py-2.5 text-xs font-mono bg-surface-100 border border-surface-200 rounded-lg text-surface-900 placeholder:text-surface-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 resize-y transition-colors"
                  placeholder="Request body (JSON)..."
                />
              </div>
            )}

            {/* Response schema info */}
            {successResponse?.schema && (
              <div>
                <h3 className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                  Response Schema
                  <span className="ml-2 font-normal normal-case text-surface-400">
                    {successResponse.statusCode} — {successResponse.description}
                  </span>
                </h3>
                <div className="bg-surface-50 border border-surface-200 rounded-lg p-3">
                  <SchemaView schema={successResponse.schema} depth={0} />
                </div>
              </div>
            )}

            {/* Code snippets toggle */}
            {config.features?.codeSnippets !== false && (
              <div>
                <button
                  onClick={() => setShowSnippets(!showSnippets)}
                  className="flex items-center gap-2 text-xs font-medium text-surface-600 hover:text-surface-800 transition-colors"
                >
                  {showSnippets ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Code2 className="w-3.5 h-3.5" />
                  Code Snippets
                </button>
                {showSnippets && (
                  <div className="mt-3 animate-fade-in">
                    <CodeSnippets
                      baseUrl={config.baseUrl}
                      endpoint={endpoint}
                      requestState={requestState}
                      languages={config.features?.snippetLanguages as any}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Response viewer */}
        <div className="w-[480px] flex-shrink-0 flex flex-col bg-surface-0 min-h-0">
          <div className="px-4 py-2.5 border-b border-surface-200 bg-surface-50">
            <h3 className="text-xs font-semibold text-surface-600 uppercase tracking-wider">
              Response
            </h3>
          </div>
          <ResponseViewer
            response={response}
            loading={loading}
            showHeaders={config.features?.responseHeaders}
          />
        </div>
      </div>
    </div>
  );
}

/** Recursive schema viewer */
function SchemaView({
  schema,
  depth,
}: {
  schema: Record<string, any>;
  depth: number;
}) {
  if (!schema || !schema.properties) {
    const typeStr = schema?.type ?? 'any';
    return (
      <span className="text-[11px] font-mono text-surface-500">
        {typeStr}
        {schema?.nullable && '?'}
        {schema?.enum && ` (${schema.enum.join(' | ')})`}
      </span>
    );
  }

  return (
    <div className={cn('space-y-1', depth > 0 && 'ml-4 pl-3 border-l border-surface-200')}>
      {Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
        const isRequired = schema.required?.includes(key);
        const hasChildren = prop.properties || (prop.items?.properties);
        return (
          <div key={key}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium text-brand-400">
                {key}
              </span>
              {isRequired && <span className="text-[9px] text-red-400">req</span>}
              <span className="text-[10px] font-mono text-surface-400">
                {prop.type ?? 'object'}
                {prop.nullable && '?'}
                {prop.format && ` (${prop.format})`}
              </span>
              {prop.description && (
                <span className="text-[10px] text-surface-400 truncate">
                  — {prop.description}
                </span>
              )}
            </div>
            {hasChildren && (
              <SchemaView
                schema={prop.items?.properties ? prop.items : prop}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
