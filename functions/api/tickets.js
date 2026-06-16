const VALID_CATEGORIES = new Set(["development", "maintenance", "other"]);
const VALID_PRIORITIES = new Set(["critical", "medium", "low"]);

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function getAdminPassword(env) {
  return env.ADMIN_PASSWORD || "";
}

function isAdmin(request, env) {
  const expected = getAdminPassword(env);
  return Boolean(expected) && request.headers.get("x-admin-password") === expected;
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normalizeChoice(value, allowed, fallback) {
  return allowed.has(value) ? value : fallback;
}

async function ensureTicketsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      department TEXT,
      contact TEXT,
      category TEXT NOT NULL DEFAULT 'other',
      priority TEXT NOT NULL DEFAULT 'medium',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      resolution_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  await db.prepare("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at)").run();
}

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) {
    return json({ error: "管理员密码不正确" }, 401);
  }

  await ensureTicketsTable(env.DB);

  const sql = `
    SELECT id, title, requester_name, department, contact, category, priority,
      description, status, resolution_notes, created_at, updated_at
    FROM tickets
    ORDER BY datetime(created_at) DESC
    LIMIT 200
  `;

  const result = await env.DB.prepare(sql).all();
  return json({ tickets: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "请求格式不正确" }, 400);
  }

  const ticket = {
    title: cleanText(body.title, 120),
    requesterName: cleanText(body.requesterName, 80),
    department: "",
    contact: "",
    category: normalizeChoice(body.category, VALID_CATEGORIES, "other"),
    priority: normalizeChoice(body.priority, VALID_PRIORITIES, "medium"),
    description: cleanText(body.description, 3000)
  };

  if (!ticket.title || !ticket.requesterName) {
    return json({ error: "请填写任务和反馈人" }, 400);
  }

  await ensureTicketsTable(env.DB);

  const result = await env.DB.prepare(`
    INSERT INTO tickets (
      title, requester_name, department, contact, category, priority, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ticket.title,
    ticket.requesterName,
    ticket.department,
    ticket.contact,
    ticket.category,
    ticket.priority,
    ticket.description
  ).run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}
