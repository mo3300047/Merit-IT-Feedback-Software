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
