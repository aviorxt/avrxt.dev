import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('migrations bootstrap cleanly, isolate drafts/tokens and enforce shared rate limits', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    for (const name of (await readdir('supabase/migrations')).sort()) await db.exec(await readFile(`supabase/migrations/${name}`, 'utf8'));
    await db.exec("insert into public.documents(slug,title,published) values('draft','Private',false),('published','Public',true);");
    await db.exec('set role anon');
    const visible = await db.query<{ slug: string }>('select slug from public.documents');
    assert.deepEqual(visible.rows.map(row => row.slug), ['published']);
    await assert.rejects(db.query('select * from public.spotify_tokens'));
    await assert.rejects(db.query('select * from public.newsletter_confirmations'));
    await assert.rejects(db.query("insert into public.documents(slug,title) values('bad','Bad')"));
    await db.exec('reset role; set role service_role');
    const consume = async () => (await db.query<{ allowed: boolean }>("select public.consume_rate_limit($1,2,60) as allowed", ['a'.repeat(64)])).rows[0].allowed;
    assert.equal(await consume(), true);
    assert.equal(await consume(), true);
    assert.equal(await consume(), false);
    await db.exec('reset role');
    await db.query('update public.api_rate_limits set expires_at=now()-interval \'1 second\'');
    await db.exec('set role service_role'); assert.equal(await consume(), true);
  } finally { await db.close(); }
});
