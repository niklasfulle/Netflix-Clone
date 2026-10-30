/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { promises: fs } = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { SnapshotError } = require('./model');

const identifier = value => `"${value.replaceAll('"', '""')}"`;
const tableName = value => `public.${identifier(value)}`;

function restoreOrder(tables, references) {
  const result = [];
  const remaining = new Set(tables);
  while (remaining.size) {
    const ready = [...remaining].filter(name => !references.some(ref => ref.child === name && ref.parent !== name && remaining.has(ref.parent)));
    if (!ready.length) throw new SnapshotError('Target backup has cyclic table dependencies; this schema is not supported for automatic import.');
    result.push(...ready);
    for (const name of ready) remaining.delete(name);
  }
  return result;
}

async function writeTargetBackup(client, output) {
  await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true, mode: 0o700 });
  const file = await fs.open(output, 'wx', 0o600);
  let bytes = 0;
  const write = async text => {
    bytes += Buffer.byteLength(text);
    if (bytes > 500 * 1024 * 1024) throw new SnapshotError('Target data backup exceeds 500 MiB. Use an empty isolated target database or reduce old target history.');
    await file.writeFile(text);
  };
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const { rows: tables } = await client.query("SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relispartition ORDER BY c.relname");
    const { rows: references } = await client.query("SELECT child.relname AS child, parent.relname AS parent FROM pg_constraint fk JOIN pg_class child ON child.oid=fk.conrelid JOIN pg_class parent ON parent.oid=fk.confrelid WHERE fk.contype='f' AND child.relnamespace='public'::regnamespace AND parent.relnamespace='public'::regnamespace");
    const names = restoreOrder(tables.map(table => table.name), references);
    if (!names.length) throw new SnapshotError('Target schema is empty; initialize it before importing.');
    const delimiter = `$backup_${randomBytes(16).toString('hex')}$`;
    await write('-- Private target public-schema data backup. Restore only to this same schema.\n\\set ON_ERROR_STOP on\nBEGIN;\nSET CONSTRAINTS ALL DEFERRED;\n');
    await write(`TRUNCATE TABLE ${names.map(tableName).join(', ')};\n`);
    for (const name of names) {
      const { rows } = await client.query(`SELECT row_to_json(t)::text AS json FROM ${tableName(name)} t`);
      if (!rows.length) continue;
      const json = `[${rows.map(row => row.json).join(',')}]`;
      if (json.includes(delimiter)) throw new SnapshotError('Could not encode target backup.');
      await write(`INSERT INTO ${tableName(name)} SELECT * FROM json_populate_recordset(NULL::${tableName(name)}, ${delimiter}${json}${delimiter}::json);\n`);
    }
    const { rows: sequences } = await client.query("SELECT sequencename FROM pg_sequences WHERE schemaname='public'");
    for (const sequence of sequences) {
      const { rows: [state] } = await client.query(`SELECT last_value::text AS value, is_called FROM ${tableName(sequence.sequencename)}`);
      if (!/^\d+$/.test(state.value)) throw new SnapshotError('Invalid sequence state in target backup.');
      const regclass = tableName(sequence.sequencename).replaceAll("'", "''");
      await write(`SELECT setval('${regclass}'::regclass, ${state.value}, ${state.is_called ? 'true' : 'false'});\n`);
    }
    await write('COMMIT;\n');
    await client.query('COMMIT');
    await file.sync();
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    await file.close();
    await fs.rm(output, { force: true });
    throw error;
  }
  await file.close();
  return { bytes };
}

module.exports = { restoreOrder, writeTargetBackup };
