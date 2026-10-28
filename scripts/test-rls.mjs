/**
 * Chequeo rápido de permisos (RLS) sin tocar la nube ni usar Docker: aplica
 * supabase/migrations/*.sql en un Postgres embebido (PGlite) con stubs mínimos de
 * Supabase (auth, storage, roles) y verifica qué puede hacer cada rol.
 *
 * Uso: npm run db:test   (córrelo antes de `npm run db:push`)
 */
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");
const migrations = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"));

const db = new PGlite();

// ─── Stubs de Supabase ──────────────────────────────────────────────────────
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text,
    raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql as
    $$ select string_to_array(name, '/') $$;
  create publication supabase_realtime;
  grant usage on schema public, auth, storage to anon, authenticated;
`);

for (const sql of migrations) await db.exec(sql);

// ─── Datos de prueba ────────────────────────────────────────────────────────
const USUARIO = "11111111-1111-1111-1111-111111111111";
const OTRO_USUARIO = "33333333-3333-3333-3333-333333333333";
const ADMIN = "22222222-2222-2222-2222-222222222222";

for (const [id, role, email] of [
  [USUARIO, "usuario", "usuario@elogia.test"],
  [OTRO_USUARIO, "usuario", "otro@elogia.test"],
  [ADMIN, "admin", "admin@elogia.test"],
]) {
  await db.exec(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
    values ('${id}', '${email}', '{"role":"${role}"}', '{"full_name":"${role}"}')`);
}

async function as(uid, sql) {
  await db.exec(
    `set role ${uid ? "authenticated" : "anon"}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`,
  );
  try {
    return { rows: (await db.query(sql)).rows };
  } catch (e) {
    return { error: e.message };
  } finally {
    await db.exec("reset role;");
  }
}

// ─── Casos ──────────────────────────────────────────────────────────────────
let fallas = 0;
function check(nombre, ok, detalle) {
  console.log(`${ok ? "✓" : "✗"} ${nombre}`);
  if (!ok) {
    fallas++;
    console.log("   ", JSON.stringify(detalle));
  }
}
const ok = (r, n) => !r.error && (n === undefined || r.rows.length === n);
const err = (r) => Boolean(r.error);
const insertCC = (doc) =>
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular) values ('CC', '${doc}', true)`;

let r = await as(USUARIO, `${insertCC("123")} returning created_by, estado`);
check(
  "usuario crea solicitud CC (el autor sale de la sesión)",
  ok(r, 1) &&
    r.rows[0].created_by === USUARIO &&
    r.rows[0].estado === "enviada",
  r,
);

r = await as(OTRO_USUARIO, insertCC("456"));
check("otro usuario crea su solicitud", ok(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular) values ('CE', '1', true)`,
);
check("CE sin fecha de expedición se rechaza", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular) values ('CC', '1', false)`,
);
check("sin autorización del titular se rechaza", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular, estado) values ('CC', '1', true, 'finalizada')`,
);
check("usuario no puede fijar el estado", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular, created_by) values ('CC', '1', true, '${OTRO_USUARIO}')`,
);
check("usuario no puede crear a nombre de otro", err(r), r);

// Vehículo con remolque (contexto §14.6)
const insertPlaca = (extra = "", valores = "") =>
  `insert into public.solicitudes (tipo_documento, placa, documento, tipo_doc_propietario, autorizacion_titular${extra})
   values ('PLACA', 'SNT413', '71234556', 'CC', true${valores}) returning numero`;

r = await as(
  USUARIO,
  insertPlaca(
    ", placa_remolque, tipo_doc_propietario_remolque, documento_propietario_remolque",
    ", 'R41130', 'NIT', '900345112'",
  ),
);
check("vehículo con remolque de otro propietario se acepta", ok(r, 1), r);

r = await as(USUARIO, insertPlaca(", placa_remolque", ", 'S12345'"));
check("remolque del mismo propietario se acepta", ok(r, 1), r);

r = await as(USUARIO, insertPlaca(", placa_remolque", ", 'ABC123'"));
check("placa de remolque inválida se rechaza", err(r), r);

r = await as(
  USUARIO,
  insertPlaca(
    ", placa_remolque, tipo_doc_propietario_remolque",
    ", 'R41130', 'CC'",
  ),
);
check("propietario del remolque incompleto se rechaza", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, placa_remolque, autorizacion_titular) values ('CC', '123', 'R41130', true)`,
);
check("remolque en consulta por documento se rechaza", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular, simulada) values ('CC', '1', true, true)`,
);
check("usuario no puede marcar una solicitud como simulada", err(r), r);

// Limpiar las de vehículo para no alterar los conteos de abajo
await db.exec(`delete from public.solicitudes where tipo_documento = 'PLACA'`);

// El sistema (sin RLS) registra los resultados
await db.exec(`insert into public.solicitud_resultados (solicitud_id, hallazgo, hallazgo_nivel)
  select id, true, 'alto' from public.solicitudes`);

r = await as(USUARIO, `select * from public.solicitud_resultados`);
check("usuario NO ve resultados/hallazgos", ok(r, 0), r);

r = await as(USUARIO, `select documento from public.solicitudes`);
check(
  "usuario ve solo sus solicitudes (no las de otros)",
  ok(r, 1) && r.rows[0].documento === "123",
  r,
);

r = await as(
  USUARIO,
  `update public.profiles set role = 'admin' where id = '${USUARIO}'`,
);
check("usuario no puede subirse a admin", err(r), r);

r = await as(
  USUARIO,
  `update public.profiles set full_name = 'Nuevo' where id = '${USUARIO}' returning full_name`,
);
check("usuario edita su nombre", ok(r, 1), r);

r = await as(USUARIO, `select id from public.profiles`);
check("usuario solo ve su perfil", ok(r, 1), r);

r = await as(
  USUARIO,
  `update public.configuracion set requiere_confirmacion_envio = true returning id`,
);
check("usuario no cambia la configuración", ok(r, 0) || err(r), r);

r = await as(ADMIN, `select id from public.solicitudes`);
check("admin ve todas las solicitudes (2)", ok(r, 2), r);

r = await as(ADMIN, `select hallazgo_nivel from public.solicitud_resultados`);
check(
  "admin ve resultados",
  ok(r, 2) && r.rows[0].hallazgo_nivel === "alto",
  r,
);

r = await as(
  ADMIN,
  `update public.solicitud_resultados set revision_estado = 'aprobado' returning revisado_por`,
);
check(
  "admin aprueba y queda registrado quién",
  ok(r, 2) && r.rows[0].revisado_por === ADMIN,
  r,
);

// La decisión (no los hallazgos) llega a la solicitud del usuario
r = await as(
  USUARIO,
  `select decision, decision_comentario from public.solicitudes`,
);
check(
  "usuario ve la decisión de su solicitud",
  ok(r, 1) && r.rows[0].decision === "aprobado",
  r,
);

r = await as(
  ADMIN,
  `update public.solicitud_resultados set revision_estado = 'rechazado', revision_comentario = 'Documento ilegible'
   where solicitud_id = (select id from public.solicitudes where documento = '123') returning solicitud_id`,
);
r = await as(
  USUARIO,
  `select decision, decision_comentario from public.solicitudes`,
);
check(
  "usuario ve el rechazo y el comentario del admin",
  ok(r, 1) &&
    r.rows[0].decision === "rechazado" &&
    r.rows[0].decision_comentario === "Documento ilegible",
  r,
);

r = await as(USUARIO, `update public.solicitudes set decision = 'aprobado'`);
check("usuario no puede cambiar la decisión", err(r) || ok(r, 0), r);

r = await as(
  ADMIN,
  `update public.solicitud_resultados set hallazgo_nivel = 'bajo'`,
);
check("admin no puede alterar el hallazgo", err(r), r);

r = await as(ADMIN, `select id from public.profiles`);
check("admin ve todos los perfiles (3)", ok(r, 3), r);

r = await as(
  ADMIN,
  `update public.configuracion set requiere_confirmacion_envio = true returning id`,
);
check("admin cambia la configuración", ok(r, 1), r);

await db.exec(
  `update public.profiles set active = false where id = '${USUARIO}'`,
);
r = await as(USUARIO, `select id from public.solicitudes`);
check("usuario desactivado no ve sus solicitudes", ok(r, 0), r);
r = await as(USUARIO, insertCC("789"));
check("usuario desactivado no puede crear solicitudes", err(r), r);

await db.exec(
  `update public.profiles set active = false where id = '${ADMIN}'`,
);
r = await as(ADMIN, `select solicitud_id from public.solicitud_resultados`);
check("admin desactivado pierde acceso", ok(r, 0), r);

r = await as(null, `select id from public.solicitudes`);
check("anónimo no lee nada", err(r), r);

console.log(
  fallas
    ? `\n${fallas} prueba(s) fallaron`
    : "\nTodas las pruebas de RLS pasaron",
);
process.exit(fallas ? 1 : 0);
