import { Injectable } from '@angular/core';
import { injectPackageContext } from '@olx/package-ui-sdk';
import {
  DATE_KEYS,
  JSON_LIST_KEYS,
  JSON_MAP_KEYS,
  NUMBER_KEYS,
  type DocRecord,
  type LookupRow,
  type SearchHit,
  type StatusRow,
  type ToolRows,
} from './metodika-dto';
import { MetodikaTool, TOOL_INPUT_KEYS } from './metodika-tool';

/** A Tool call failed; carries the Tool name and the code of the rejection when it had one. */
export class MetodikaToolError extends Error {
  constructor(
    readonly tool: MetodikaTool,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'MetodikaToolError';
  }
}

type Wire = Record<string, unknown>;

const camel = (key: string): string => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const snake = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = new Date(typeof value === 'string' ? value : NaN);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

function parsed(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function camelObject(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value;
  }
  return Object.fromEntries(Object.entries(value as Wire).map(([key, inner]) => [camel(key), inner]));
}

function mapRow(row: Wire): Wire {
  const mapped: Wire = {};
  for (const [key, value] of Object.entries(row)) {
    const name = camel(key);
    if (DATE_KEYS.includes(name)) {
      mapped[name] = toDate(value);
    } else if (NUMBER_KEYS.includes(name)) {
      mapped[name] = toNumber(value);
    } else if (JSON_LIST_KEYS.includes(name)) {
      const list = parsed(value);
      mapped[name] = Array.isArray(list) ? list.map(camelObject) : [];
    } else if (JSON_MAP_KEYS.includes(name)) {
      const map = parsed(value);
      mapped[name] = typeof map === 'object' && map !== null && !Array.isArray(map) ? map : {};
    } else {
      mapped[name] = value;
    }
  }
  return mapped;
}

/** snake case input from camelCase arguments; undefined arguments are dropped, only keys of the Tool are sent. */
function buildInput(tool: MetodikaTool, args: Readonly<Record<string, unknown>>): Wire {
  const allowed = TOOL_INPUT_KEYS[tool];
  const input: Wire = {};
  for (const [key, value] of Object.entries(args)) {
    const wire = snake(key);
    if (value !== undefined && allowed.includes(wire)) {
      input[wire] = value;
    }
  }
  return input;
}

interface Unwrapped {
  readonly rows: readonly Wire[];
  readonly warnings: readonly string[];
}

function warningCode(warning: unknown): string {
  if (typeof warning === 'string') {
    return warning;
  }
  const found = typeof warning === 'object' && warning !== null ? (warning as { message?: unknown; code?: unknown }) : {};
  if (typeof found.message === 'string' && found.message !== '') {
    return found.message;
  }
  return typeof found.code === 'string' ? found.code : 'unknown';
}

/** A Tool answer is either the rows or the envelope `{ data, warnings? }`. */
function unwrap(result: unknown): Unwrapped {
  if (Array.isArray(result)) {
    return { rows: result as Wire[], warnings: [] };
  }
  if (typeof result === 'object' && result !== null && Array.isArray((result as { data?: unknown }).data)) {
    const envelope = result as { data: Wire[]; warnings?: unknown };
    const warnings = Array.isArray(envelope.warnings) ? (envelope.warnings as unknown[]).map(warningCode) : [];
    return { rows: envelope.data, warnings };
  }
  return { rows: [], warnings: [] };
}

function codeOf(error: unknown): string | null {
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  return typeof code === 'string' ? code : null;
}

export interface LookupArgs {
  readonly fonte?: string | undefined;
  readonly section?: string | undefined;
  readonly tipo?: string | undefined;
  readonly numero?: string | undefined;
  readonly anno?: number | undefined;
  readonly dataFrom?: string | undefined;
  readonly dataTo?: string | undefined;
  readonly ente?: string | undefined;
  readonly sort?: string | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

export interface SearchArgs {
  readonly query?: string | undefined;
  readonly k?: number | undefined;
  readonly mode?: string | undefined;
  readonly fonte?: string | undefined;
  readonly section?: string | undefined;
  readonly tipo?: string | undefined;
  readonly ente?: string | undefined;
  readonly annoFrom?: number | undefined;
  readonly annoTo?: number | undefined;
  readonly dataFrom?: string | undefined;
  readonly dataTo?: string | undefined;
}

export interface DocArgs {
  readonly id?: string | undefined;
  readonly fonte?: string | undefined;
  readonly sourceId?: string | undefined;
  readonly tipo?: string | undefined;
  readonly numero?: string | undefined;
  readonly anno?: number | undefined;
  readonly offset?: number | undefined;
  readonly length?: number | undefined;
}

/** The only place the Screens call Tools: camelCase in, camelCase rows out. */
@Injectable()
export class MetodikaTools {
  private readonly context = injectPackageContext();

  private async call(tool: MetodikaTool, args: Readonly<Record<string, unknown>> = {}): Promise<Unwrapped> {
    try {
      return unwrap(await this.context().tools.call<unknown>(tool, buildInput(tool, args)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new MetodikaToolError(tool, codeOf(error), message);
    }
  }

  private async rows<T>(tool: MetodikaTool, args: Readonly<Record<string, unknown>> = {}): Promise<ToolRows<T>> {
    const { rows, warnings } = await this.call(tool, args);
    return { rows: rows.map((row) => mapRow(row) as T), warnings };
  }

  lookup(args: LookupArgs): Promise<ToolRows<LookupRow>> {
    return this.rows(MetodikaTool.Lookup, { ...args });
  }

  search(args: SearchArgs): Promise<ToolRows<SearchHit>> {
    return this.rows(MetodikaTool.Search, { ...args });
  }

  /** The documents the key matches (the estremi key can match several rows); the text is the slice at `offset`. */
  doc(args: DocArgs): Promise<ToolRows<DocRecord>> {
    return this.rows(MetodikaTool.Doc, { ...args });
  }

  status(): Promise<ToolRows<StatusRow>> {
    return this.rows(MetodikaTool.Status);
  }
}
