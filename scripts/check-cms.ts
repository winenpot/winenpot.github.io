/**
 * CMS drift check: does the /admin form (public/admin/config.yml) still
 * match the content schemas (src/schemas.ts)? Run: `pnpm run check:cms`.
 *
 * For every collection, at every nesting level (lists of objects too):
 *  - each schema field has a CMS field, except `lang` (internal default);
 *  - each CMS field exists in the schema, except `body` (the Markdown body);
 *  - "required" agrees: a schema field is required when it accepts no
 *    `undefined` (no .optional()/.default()), a CMS field unless it says
 *    `required: false`.
 * Exits 1 with one line per mismatch.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { schemas } from '../src/schemas.ts';

type CmsField = { name: string; widget?: string; required?: boolean; fields?: CmsField[]; field?: CmsField };
type CmsCollection = { name: string; fields?: CmsField[]; files?: { name: string; fields: CmsField[] }[] };

const IGNORE_SCHEMA = new Set(['lang']);
const IGNORE_CMS = new Set(['body']);

let config: { collections: CmsCollection[] };
try {
  config = parse(readFileSync(new URL('../public/admin/config.yml', import.meta.url), 'utf8'));
} catch (err) {
  console.error(`public/admin/config.yml is not valid YAML: ${(err as Error).message}`);
  process.exit(1);
}
const cms = new Map<string, CmsField[]>();
for (const c of config.collections) {
  if (c.fields) cms.set(c.name, c.fields);
  for (const f of c.files ?? []) cms.set(f.name, f.fields);
}

const errors: string[] = [];

/** Strip .optional()/.default() wrappers to the real type. */
function unwrap(s: any): any {
  while (s?.def?.innerType) s = s.def.innerType;
  return s;
}
/** The object shape a field holds, directly or as the element of an array. */
function shapeOf(s: any): Record<string, any> | undefined {
  const t = unwrap(s);
  if (t?.def?.type === 'object') return t.shape;
  if (t?.def?.type === 'array') return shapeOf(t.def.element);
  return undefined;
}

function compare(shape: Record<string, any>, fields: CmsField[], at: string) {
  const byName = new Map(fields.map((f) => [f.name, f]));
  for (const [key, s] of Object.entries(shape)) {
    if (IGNORE_SCHEMA.has(key)) continue;
    const f = byName.get(key);
    if (!f) { errors.push(`${at}.${key}: in src/schemas.ts but missing from public/admin/config.yml`); continue; }
    const schemaRequired = !s.safeParse(undefined).success;
    const cmsRequired = f.required !== false;
    if (schemaRequired !== cmsRequired) {
      errors.push(`${at}.${key}: schema says ${schemaRequired ? 'required' : 'optional'}, CMS says ${cmsRequired ? 'required' : 'optional (required: false)'}`);
    }
    const inner = shapeOf(s);
    if (inner && f.fields) compare(inner, f.fields, `${at}.${key}`);
    else if (inner && !f.fields) errors.push(`${at}.${key}: schema holds objects, CMS field has no sub-fields`);
  }
  for (const f of fields) {
    if (!IGNORE_CMS.has(f.name) && !(f.name in shape)) errors.push(`${at}.${f.name}: in the CMS but not in src/schemas.ts`);
  }
}

for (const [name, schema] of Object.entries(schemas)) {
  const fields = cms.get(name);
  if (!fields) { errors.push(`${name}: no CMS collection or file named "${name}" in public/admin/config.yml`); continue; }
  compare(schema.shape, fields, name);
}

if (errors.length) {
  console.error(`CMS config is out of sync with src/schemas.ts (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`CMS config matches src/schemas.ts (${Object.keys(schemas).length} collections).`);
