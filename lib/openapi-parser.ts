import type {
  ParsedSpec,
  ParsedEndpoint,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
  SchemaObject,
  SpecInfo,
  SpecServer,
  SpecTag,
} from './types';

/**
 * Parse a raw OpenAPI 3.x JS object into the playground's internal format.
 * Works with both 3.0 and 3.1 specs.
 */
export function parseOpenAPISpec(raw: Record<string, any>): ParsedSpec {
  const info = parseInfo(raw.info ?? {});
  const servers = parseServers(raw.servers ?? []);
  const tags = parseTags(raw.tags ?? []);
  const schemas = parseSchemas(raw.components?.schemas ?? {}, raw);
  const endpoints = parseEndpoints(raw.paths ?? {}, raw);

  return { info, servers, tags, endpoints, schemas };
}

function parseInfo(raw: any): SpecInfo {
  return {
    title: raw.title ?? 'API',
    description: raw.description,
    version: raw.version ?? '1.0.0',
  };
}

function parseServers(raw: any[]): SpecServer[] {
  return raw.map((s) => ({ url: s.url, description: s.description }));
}

function parseTags(raw: any[]): SpecTag[] {
  return raw.map((t) => ({ name: t.name, description: t.description }));
}

function parseSchemas(
  raw: Record<string, any>,
  root: Record<string, any>,
): Record<string, SchemaObject> {
  const result: Record<string, SchemaObject> = {};
  for (const [name, schema] of Object.entries(raw)) {
    result[name] = resolveSchema(schema, root);
  }
  return result;
}

function parseEndpoints(
  paths: Record<string, any>,
  root: Record<string, any>,
): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];
  const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;

      const parameters: ParsedParameter[] = [
        ...(pathItem.parameters ?? []),
        ...(op.parameters ?? []),
      ].map((p: any) => parseParameter(p, root));

      let requestBody: ParsedRequestBody | undefined;
      if (op.requestBody) {
        requestBody = parseRequestBody(op.requestBody, root);
      }

      const responses: ParsedResponse[] = [];
      if (op.responses) {
        for (const [code, resp] of Object.entries(op.responses as Record<string, any>)) {
          responses.push(parseResponse(code, resp, root));
        }
      }

      endpoints.push({
        operationId: op.operationId ?? `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        method: method.toUpperCase() as ParsedEndpoint['method'],
        path,
        summary: op.summary,
        description: op.description,
        tags: op.tags ?? [],
        deprecated: op.deprecated ?? false,
        parameters,
        requestBody,
        responses,
      });
    }
  }

  return endpoints;
}

function parseParameter(raw: any, root: Record<string, any>): ParsedParameter {
  const resolved = resolveRef(raw, root);
  return {
    name: resolved.name,
    in: resolved.in,
    required: resolved.required ?? false,
    description: resolved.description,
    schema: resolveSchema(resolved.schema ?? {}, root),
  };
}

function parseRequestBody(raw: any, root: Record<string, any>): ParsedRequestBody {
  const resolved = resolveRef(raw, root);
  const content = resolved.content ?? {};
  const contentType = Object.keys(content)[0] ?? 'application/json';
  const mediaType = content[contentType] ?? {};

  return {
    required: resolved.required ?? false,
    description: resolved.description,
    contentType,
    schema: resolveSchema(mediaType.schema ?? {}, root),
  };
}

function parseResponse(
  statusCode: string,
  raw: any,
  root: Record<string, any>,
): ParsedResponse {
  const resolved = resolveRef(raw, root);
  const content = resolved.content ?? {};
  const contentType = Object.keys(content)[0];
  let schema: SchemaObject | undefined;

  if (contentType && content[contentType]?.schema) {
    schema = resolveSchema(content[contentType].schema, root);
  }

  return {
    statusCode,
    description: resolved.description,
    contentType,
    schema,
  };
}

/** Resolve a $ref pointer to the actual object */
function resolveRef(obj: any, root: Record<string, any>): any {
  if (!obj || !obj.$ref) return obj;

  const refPath = obj.$ref.replace('#/', '').split('/');
  let current: any = root;
  for (const segment of refPath) {
    current = current?.[segment];
  }
  return current ?? obj;
}

/** Resolve a schema, following $ref and expanding inline */
function resolveSchema(schema: any, root: Record<string, any>): SchemaObject {
  if (!schema) return {};

  if (schema.$ref) {
    const resolved = resolveRef(schema, root);
    return resolveSchema(resolved, root);
  }

  const result: SchemaObject = {
    type: schema.type,
    format: schema.format,
    description: schema.description,
    nullable: schema.nullable,
    default: schema.default,
    example: schema.example,
    minimum: schema.minimum,
    maximum: schema.maximum,
  };

  if (schema.enum) {
    result.enum = schema.enum;
  }

  if (schema.items) {
    result.items = resolveSchema(schema.items, root);
  }

  if (schema.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      result.properties[key] = resolveSchema(value as any, root);
    }
  }

  if (schema.required) {
    result.required = schema.required;
  }

  return result;
}

/** Group endpoints by their first tag */
export function groupEndpointsByTag(
  endpoints: ParsedEndpoint[],
  tags: SpecTag[],
): { tag: SpecTag; endpoints: ParsedEndpoint[] }[] {
  const tagMap = new Map<string, ParsedEndpoint[]>();

  for (const ep of endpoints) {
    const tagName = ep.tags[0] ?? 'default';
    if (!tagMap.has(tagName)) tagMap.set(tagName, []);
    tagMap.get(tagName)!.push(ep);
  }

  const result: { tag: SpecTag; endpoints: ParsedEndpoint[] }[] = [];

  // Preserve tag ordering from the spec
  for (const tag of tags) {
    const eps = tagMap.get(tag.name);
    if (eps) {
      result.push({ tag, endpoints: eps });
      tagMap.delete(tag.name);
    }
  }

  // Any remaining tags not declared in spec
  for (const [name, eps] of tagMap) {
    result.push({ tag: { name, description: undefined }, endpoints: eps });
  }

  return result;
}

/** Build a sample JSON body from a schema */
export function buildSampleBody(schema: SchemaObject): any {
  if (!schema) return {};

  if (schema.example !== undefined) return schema.example;

  switch (schema.type) {
    case 'object': {
      const obj: Record<string, any> = {};
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          obj[key] = buildSampleBody(prop);
        }
      }
      return obj;
    }
    case 'array':
      return schema.items ? [buildSampleBody(schema.items)] : [];
    case 'string':
      if (schema.enum) return schema.enum[0];
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date') return new Date().toISOString().split('T')[0];
      if (schema.default !== undefined) return schema.default;
      return '';
    case 'integer':
    case 'number':
      if (schema.default !== undefined) return schema.default;
      if (schema.minimum !== undefined) return schema.minimum;
      return 0;
    case 'boolean':
      return schema.default ?? false;
    default:
      return schema.default ?? null;
  }
}
