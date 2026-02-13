import type { ParsedEndpoint, RequestState } from './types';

export function generateCurl(
  baseUrl: string,
  endpoint: ParsedEndpoint,
  state: RequestState,
): string {
  let url = buildUrl(baseUrl, endpoint, state);
  const lines: string[] = [`curl -X ${endpoint.method} '${url}'`];

  if (state.authToken) {
    if (state.authType === 'bearer') {
      lines.push(`  -H 'Authorization: Bearer ${state.authToken}'`);
    } else if (state.authType === 'apiKey') {
      lines.push(`  -H 'X-API-Key: ${state.authToken}'`);
    }
  }

  if (endpoint.requestBody && state.body) {
    lines.push(`  -H 'Content-Type: application/json'`);
    lines.push(`  -d '${state.body}'`);
  }

  return lines.join(' \\\n');
}

export function generateJavaScript(
  baseUrl: string,
  endpoint: ParsedEndpoint,
  state: RequestState,
): string {
  const url = buildUrl(baseUrl, endpoint, state);
  const headers: Record<string, string> = {};
  if (state.authToken) {
    if (state.authType === 'bearer') headers['Authorization'] = `Bearer ${state.authToken}`;
    else if (state.authType === 'apiKey') headers['X-API-Key'] = state.authToken;
  }
  if (endpoint.requestBody && state.body) headers['Content-Type'] = 'application/json';

  let code = `const response = await fetch('${url}', {\n`;
  code += `  method: '${endpoint.method}',\n`;
  if (Object.keys(headers).length > 0) {
    code += `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},\n`;
  }
  if (endpoint.requestBody && state.body) {
    code += `  body: JSON.stringify(${state.body}),\n`;
  }
  code += `});\n\nconst data = await response.json();\nconsole.log(data);`;
  return code;
}

export function generatePython(
  baseUrl: string,
  endpoint: ParsedEndpoint,
  state: RequestState,
): string {
  const url = buildUrl(baseUrl, endpoint, state);
  let code = `import requests\n\n`;
  const headers: Record<string, string> = {};
  if (state.authToken) {
    if (state.authType === 'bearer') headers['Authorization'] = `Bearer ${state.authToken}`;
    else if (state.authType === 'apiKey') headers['X-API-Key'] = state.authToken;
  }

  code += `response = requests.${endpoint.method.toLowerCase()}(\n`;
  code += `    "${url}",\n`;
  if (Object.keys(headers).length > 0) {
    code += `    headers=${JSON.stringify(headers).replace(/"/g, '"')},\n`;
  }
  if (endpoint.requestBody && state.body) {
    code += `    json=${state.body},\n`;
  }
  code += `)\n\nprint(response.json())`;
  return code;
}

function buildUrl(baseUrl: string, endpoint: ParsedEndpoint, state: RequestState): string {
  let path = endpoint.path;
  for (const [key, value] of Object.entries(state.pathParams)) {
    if (value) path = path.replace(`{${key}}`, encodeURIComponent(value));
  }
  const query = Object.entries(state.queryParams)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${baseUrl}${path}${query ? '?' + query : ''}`;
}

export { buildUrl };
