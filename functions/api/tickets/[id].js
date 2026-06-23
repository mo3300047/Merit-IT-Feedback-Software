function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function isAdmin(request, env) {
  const expected = env.ADMIN_PASSWORD || "";
  return Boolean(expected) && request.headers.get("x-admin-password") === expected;
}

function normalizeProgress(value) {
  const progress = Number(value);
  if (!Number.isFinite(progress)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(progress)));
}

async function ensureProgressColumn(db) {
  const columns = await db.prepare("PRAGMA table_info(tickets)").all();
  const hasProgress = (columns.results || []).some((column) => column.name === "progress");
  if (!hasProgress) {
    await db.prepare("ALTER TABLE tickets ADD COLUMN progress INTEGER NOT NULL DEFAULT 0").run();
  }
}

export async function onRequestPatch({ request, env, params }) {
  if (!isAdmin(request, env)) {
    return json({ error: "管理员密码不正确" }, 401);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: "需求 ID 不正确" }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求格式不正确" }, 400);
  }

  const progress = normalizeProgress(body.progress);
  if (progress === null) {
    return json({ error: "进度不正确" }, 400);
  }

  await ensureProgressColumn(env.DB);

  const result = await env.DB.prepare(`
    UPDATE tickets
    SET progress = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(progress, id).run();

  if (!result.meta.changes) {
    return json({ error: "没有找到该需求" }, 404);
  }

  return json({ ok: true, progress });
}

export async function onRequestDelete({ request, env, params }) {
  if (!isAdmin(request, env)) {
    return json({ error: "管理员密码不正确" }, 401);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: "需求 ID 不正确" }, 400);
  }

  const result = await env.DB.prepare("DELETE FROM tickets WHERE id = ?").bind(id).run();
  if (!result.meta.changes) {
    return json({ error: "没有找到该需求" }, 404);
  }

  return json({ ok: true });
}
