import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { Pool } from "pg";

type Row = Record<string, unknown>;
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

let _neonSql: NeonQueryFunction<false, false> | null = null;
let _pgPool: Pool | null = null;

function isNeonUrl(url: string) {
  return url.includes(".neon.tech");
}

function getNeonSql(url: string): NeonQueryFunction<false, false> {
  if (!_neonSql) _neonSql = neon(url);
  return _neonSql;
}

function getPgPool(url: string): Pool {
  if (!_pgPool) _pgPool = new Pool({ connectionString: url });
  return _pgPool;
}

export function getDb(): SqlTag {
  const url = process.env.DATABASE_URL!;

  if (isNeonUrl(url)) {
    const sql = getNeonSql(url);
    return async (strings, ...values) => {
      const rows = await sql(strings, ...values);
      return rows as Row[];
    };
  }

  const pool = getPgPool(url);
  return async (strings, ...values) => {
    let text = "";
    strings.forEach((s, i) => {
      text += s;
      if (i < values.length) text += `$${i + 1}`;
    });
    const result = await pool.query(text, values as unknown[]);
    return result.rows as Row[];
  };
}

export async function upsertUser(data: {
  githubId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (github_id, name, email, avatar_url)
    VALUES (${data.githubId}, ${data.name}, ${data.email}, ${data.avatarUrl})
    ON CONFLICT (github_id)
    DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url
    RETURNING id, github_id, name, email, avatar_url, created_at
  `;
  return rows[0] as {
    id: string;
    github_id: string;
    name: string;
    email: string;
    avatar_url: string;
    created_at: string;
  };
}
