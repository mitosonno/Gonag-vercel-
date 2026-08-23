import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";

async function verifyAdmin(req) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!serviceKey || adminEmails.length === 0) return { ok: false, error: "Server tənzimlənməyib" };

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return { ok: false, error: "Giriş tələb olunur" };

  const admin = createClient(SB_URL, serviceKey);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData || !userData.user) return { ok: false, error: "Sessiya etibarsızdır" };

  const callerEmail = (userData.user.email || "").toLowerCase();
  if (!adminEmails.includes(callerEmail)) return { ok: false, error: "İcazə yoxdur" };

  return { ok: true, admin, serviceKey };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const auth = await verifyAdmin(req);
  if (!auth.ok) { res.status(403).json({ error: auth.error }); return; }
  const { serviceKey } = auth;

  try {
    if (req.method === "GET") {
      const hallId = req.query && req.query.id;

      if (hallId) {
        // Tək bir zalın TAM detalları (redaktə üçün)
        const r = await fetch(SB_URL + "/rest/v1/halls?id=eq." + hallId + "&select=*", {
          headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey }
        });
        const rows = r.ok ? await r.json() : [];
        res.status(200).json({ ok: true, hall: rows[0] || null });
        return;
      }

      const r = await fetch(SB_URL + "/rest/v1/halls?select=id,venue_name,name,capacity,is_public,created_by,created_at&order=created_at.desc", {
        headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey }
      });
      const halls = r.ok ? await r.json() : [];

      const { data: usersList } = await auth.admin.auth.admin.listUsers({ perPage: 1000 });
      const emailById = {};
      (usersList ? usersList.users : []).forEach(u => { emailById[u.id] = u.email; });

      const withOwner = halls.map(h => ({ ...h, ownerEmail: h.created_by ? (emailById[h.created_by] || "naməlum") : "— (köhnə/admin)" }));
      res.status(200).json({ ok: true, halls: withOwner });
      return;
    }

    if (req.method === "PATCH") {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) { res.status(400).json({ error: "id tələb olunur" }); return; }
      const { id: _drop, ...updateFields } = req.body || {};
      const r = await fetch(SB_URL + "/rest/v1/halls?id=eq." + id, {
        method: "PATCH",
        headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(updateFields)
      });
      res.status(r.ok ? 200 : 500).json({ ok: r.ok });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) { res.status(400).json({ error: "id tələb olunur" }); return; }
      const r = await fetch(SB_URL + "/rest/v1/halls?id=eq." + id, {
        method: "DELETE",
        headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey }
      });
      res.status(r.ok ? 200 : 500).json({ ok: r.ok });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
