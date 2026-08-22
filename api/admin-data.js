import { createClient } from "@supabase/supabase-js";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

    if (!serviceKey) { res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY Vercel-də təyin olunmayıb" }); return; }
    if (adminEmails.length === 0) { res.status(500).json({ error: "ADMIN_EMAILS Vercel-də təyin olunmayıb" }); return; }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Giriş tələb olunur" }); return; }

    const admin = createClient(SB_URL, serviceKey);

    // Token-in kimə aid olduğunu yoxla
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData || !userData.user) { res.status(401).json({ error: "Sessiya etibarsızdır" }); return; }

    const callerEmail = (userData.user.email || "").toLowerCase();
    if (!adminEmails.includes(callerEmail)) {
      res.status(403).json({ error: "Bu bölməyə giriş icazəniz yoxdur" });
      return;
    }

    // ── Bütün istifadəçilər (auth.users) ──
    const { data: usersList, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) { res.status(500).json({ error: "İstifadəçilər yüklənmədi: " + usersErr.message }); return; }
    const users = usersList.users.map(u => ({
      id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at
    }));

    // ── Bütün məclislər (RLS-i service role ötür) ──
    const evRes = await fetch(SB_URL + "/rest/v1/events?select=id,session_id,type,couple,date,hall_name,hall_total,hall_seats,status,created_at,tables", {
      headers: { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey }
    });
    const events = evRes.ok ? await evRes.json() : [];

    // ── Qonaqları hər məclisdən çıxarıb düzləşdiririk (axtarış üçün) ──
    const guests = [];
    let totalGuestCount = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    let todayGuestCount = 0;

    const eventsSummary = events.map(ev => {
      let tblData = {};
      try { tblData = ev.tables || {}; } catch (e) {}
      const meta = tblData._meta || {};
      const actualTables = Array.isArray(tblData) ? tblData : (tblData.rows || []);
      let evGuestCount = 0;
      actualTables.forEach(t => {
        (t.guests || []).forEach(g => {
          const cnt = (g.count || 1) + (g.ushaqCount || 0);
          evGuestCount += cnt;
          totalGuestCount += cnt;
          guests.push({
            name: g.name || "", phone: g.phone || "", count: cnt,
            tableId: t.id, eventId: ev.id, couple: ev.couple || "", hallName: ev.hall_name || "",
            sessionId: ev.session_id
          });
          const gCreated = (g.createdAt || ev.created_at || "").slice(0, 10);
          if (gCreated === todayStr) todayGuestCount += cnt;
        });
      });
      return {
        id: ev.id, sessionId: ev.session_id, type: ev.type, couple: ev.couple, date: ev.date,
        hallName: ev.hall_name, hallTotal: ev.hall_total, status: ev.status, createdAt: ev.created_at,
        tableCount: actualTables.length, guestCount: evGuestCount
      };
    });

    const usersWithStats = users.map(u => {
      const theirEvents = eventsSummary.filter(e => e.sessionId === u.id);
      return {
        ...u,
        eventCount: theirEvents.length,
        totalGuests: theirEvents.reduce((s, e) => s + e.guestCount, 0)
      };
    });

    res.status(200).json({
      ok: true,
      stats: {
        totalUsers: users.length,
        totalEvents: events.length,
        totalGuests: totalGuestCount,
        todayGuests: todayGuestCount
      },
      users: usersWithStats,
      events: eventsSummary,
      guests
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
