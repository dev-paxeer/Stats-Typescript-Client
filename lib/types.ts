/** Parsed OpenAPI spec structure used by the playground */

export interface ParsedSpec {
  info: SpecInfo;
  servers: SpecServer[];
  tags: SpecTag[];
  endpoints: ParsedEndpoint[];
  schemas: Record<string, SchemaObject>;
}

export interface SpecInfo {
  title: string;
  description?: string;
  version: string;
}

export interface SpecServer {
  url: string;
  description?: string;
}

export interface SpecTag {
  name: string;
  description?: string;
}

export interface ParsedEndpoint {
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  deprecated?: boolean;
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: ParsedResponse[];
}

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  description?: string;
  schema: SchemaObject;
}

export interface ParsedRequestBody {
  required: boolean;
  description?: string;
  contentType: string;
  schema: SchemaObject;
}

export interface ParsedResponse {
  statusCode: string;
  description?: string;
  contentType?: string;
  schema?: SchemaObject;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  nullable?: boolean;
  default?: unknown;
  example?: unknown;
  minimum?: number;
  maximum?: number;
  $ref?: string;
}

/** Runtime request/response state */

export interface RequestState {
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  headerParams: Record<string, string>;
  body: string;
  authToken: string;
  authType: 'bearer' | 'apiKey' | 'basic' | 'none';
}

export interface ResponseState {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  size: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  url: string;
  status: number;
  duration: number;
}
