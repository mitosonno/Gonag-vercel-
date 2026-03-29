import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const SB_URL = "https://dpvoluttxelwnqcfnsbh.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdm9sdXR0eGVsd25xY2Zuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ4MTMsImV4cCI6MjA4ODk2MDgxM30.qodOw68r3OgeQXrr-SnzTDiXI4eI_moD4IWG-Dzj368";

async function sbFetch(path, options = {}) {
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: SB_KEY,
      Authorization: "Bearer " + SB_KEY,
      "Content-Type": "application/json",
      Prefer: options.prefer || "",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const e = await res.text();
    console.error("SB error:", e);
    return null;
  }
  try { return await res.json(); } catch { return null; }
}

export default function InvitePage() {
  const { code } = useParams();
  const [status, setStatus] = useState("loading"); // loading | ready | saved | error
  const [inviteData, setInviteData] = useState(null); // {table_ids, session_id}
  const [eventData, setEventData] = useState(null);   // full event row
  const [tables, setTables] = useState([]);            // only invited tables
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!code) { setStatus("error"); return; }
    loadInvite();
  }, [code]);

  async function loadInvite() {
    setStatus("loading");
    try {
      // 1. invite_links cədvəlindən kodu tap
      const links = await sbFetch(
        "invite_links?code=eq." + encodeURIComponent(code) + "&limit=1"
      );
      if (!links || links.length === 0) { setStatus("error"); return; }
      const link = links[0];
      setInviteData(link);

      // 2. həmin session_id-nin events-ini tap
      const events = await sbFetch(
        "events?session_id=eq." + encodeURIComponent(link.session_id) + "&order=created_at.desc&limit=1"
      );
      if (!events || events.length === 0) { setStatus("error"); return; }
      const ev = events[0];
      setEventData(ev);

      // 3. Yalnız dəvət edilmiş masaları götür
      const allTables = (ev.tables && ev.tables.rows) ? ev.tables.rows : [];
      const tblIds = link.table_ids || [];
      const myTables = allTables
        .filter(t => tblIds.includes(t.id))
        .map(t => ({
          ...t,
          guests: (t.guests || []).map(g => ({ ...g }))
        }));

      setTables(myTables);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  // Qonaq adını dəyiş
  function updateGuest(tblId, guestId, field, value) {
    setTables(prev => prev.map(t => {
      if (t.id !== tblId) return t;
      return {
        ...t,
        guests: t.guests.map(g => {
          if (g.id !== guestId) return g;
          return { ...g, [field]: value };
        })
      };
    }));
  }

  // Yeni qonaq əlavə et
  function addGuest(tblId) {
    setTables(prev => prev.map(t => {
      if (t.id !== tblId) return t;
      const newG = {
        id: "inv_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        name: "",
        phone: "",
        count: 1,
        gender: "",
        invited: false,
        _new: true
      };
      return { ...t, guests: [...t.guests, newG] };
    }));
  }

  // Qonağı sil
  function removeGuest(tblId, guestId) {
    setTables(prev => prev.map(t => {
      if (t.id !== tblId) return t;
      return { ...t, guests: t.guests.filter(g => g.id !== guestId) };
    }));
  }

  // Supabase-ə save et — orijinal event-i yenilə
  async function handleSave() {
    if (!eventData) return;
    setSaving(true);
    try {
      // Orijinal bütün masaları götür
      const allTables = (eventData.tables && eventData.tables.rows) ? [...eventData.tables.rows] : [];
      const tblIds = inviteData.table_ids || [];

      // Dəvət edilmiş masaları yenilənmiş versiya ilə əvəz et
      const updatedAll = allTables.map(t => {
        if (!tblIds.includes(t.id)) return t;
        const myT = tables.find(x => x.id === t.id);
        if (!myT) return t;
        return { ...t, guests: myT.guests };
      });

      // Yenilənmiş tables obyekti
      const newTablesObj = {
        ...(eventData.tables || {}),
        rows: updatedAll
      };

      // PATCH event
      const res = await sbFetch("events?id=eq." + eventData.id, {
        method: "PATCH",
        prefer: "return=representation",
        body: JSON.stringify({
          tables: newTablesObj,
          updated_at: new Date().toISOString()
        })
      });

      // invite_links statusunu "used"-ə çevir
      await sbFetch("invite_links?code=eq." + encodeURIComponent(code), {
        method: "PATCH",
        body: JSON.stringify({ status: "used" })
      });

      setSaving(false);
      setStatus("saved");
      setSavedMsg("✅ Məlumatlar yadda saxlandı! Masa sxeminə əlavə olundu.");
    } catch (e) {
      console.error(e);
      setSaving(false);
      setSavedMsg("❌ Xəta baş verdi. Yenidən cəhd edin.");
    }
  }

  // ── UI ──────────────────────────────────────────

  const gold = "#c9a84c";
  const bg = "#080604";

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎊</div>
        <div style={{ color: gold, fontSize: 14, fontWeight: 600 }}>Yüklənir...</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%", background: gold,
              animation: "pulse 1s ease infinite",
              animationDelay: i * 0.2 + "s", opacity: 0.7
            }}/>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(.7);opacity:.3}50%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ color: "#ff9999", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Link tapılmadı</div>
        <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13, lineHeight: 1.6 }}>
          Bu link ya vaxtı keçib, ya da yanlışdır. Dəvəti göndərən şəxslə əlaqə saxlayın.
        </div>
      </div>
    </div>
  );

  if (status === "saved") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <div style={{ color: "#50c878", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Təşəkkür edirik!</div>
        <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, lineHeight: 1.7 }}>{savedMsg}</div>
        <div style={{ marginTop: 20, color: "rgba(201,168,76,.5)", fontSize: 11 }}>
          Məclis təşkilatçısı məlumatlarınızı görəcək.
        </div>
      </div>
    </div>
  );

  // Ev/toy adı
  const ev = eventData;
  const evName = ev && ev.couple ? ev.couple
    : ev && ev.tables && ev.tables._meta && ev.tables._meta.obData
      ? (ev.tables._meta.obData.boy && ev.tables._meta.obData.girl
          ? ev.tables._meta.obData.boy + " & " + ev.tables._meta.obData.girl
          : ev.tables._meta.obData.name || "Məclis")
      : "Məclis";

  const totalSeats = tables.reduce((s, t) => s + (t.seats || 8), 0);
  const filledSeats = tables.reduce((s, t) => s + t.guests.reduce((ss, g) => ss + (g.count || 1), 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'DM Sans', sans-serif", color: "#f2e8d0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { background: rgba(255,255,255,.06); border: 1px solid rgba(201,168,76,.25); border-radius: 8px; padding: 9px 12px; color: #f2e8d0; font-size: 13px; width: 100%; outline: none; font-family: 'DM Sans', sans-serif; }
        input:focus { border-color: rgba(201,168,76,.6); }
        input::placeholder { color: rgba(255,255,255,.25); }
        select { background: rgba(255,255,255,.06); border: 1px solid rgba(201,168,76,.25); border-radius: 8px; padding: 9px 12px; color: #f2e8d0; font-size: 13px; width: 100%; outline: none; font-family: 'DM Sans', sans-serif; }
        select option { background: #1a1208; color: #f2e8d0; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(201,168,76,.12)", background: "rgba(201,168,76,.04)" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: gold, letterSpacing: 2, marginBottom: 4 }}>
          GONAG<span style={{ color: "#f2e8d0", fontStyle: "italic" }}>.AZ</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>Masa dəvəti — {evName}</div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 100px" }}>

        {/* Info banner */}
        <div style={{ background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: gold, fontWeight: 600, marginBottom: 4 }}>
            🎊 Siz {tables.length} masaya dəvət olunmusunuz
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>
            Aşağıdakı masaları doldurun — adları əlavə edin, sonra "Yadda Saxla" düyməsini basın.
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
              Toplam yer: <b style={{ color: gold }}>{totalSeats}</b>
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
              Doldurulub: <b style={{ color: "#50c878" }}>{filledSeats}</b>
            </span>
          </div>
        </div>

        {/* Tables */}
        {tables.map(t => {
          const occ = t.guests.reduce((s, g) => s + (g.count || 1), 0);
          const isFull = occ >= (t.seats || 8);
          const sc = t.side === "Oğlan evi" ? "#7aade8" : t.side === "Qız evi" ? "#e87aad" : gold;

          return (
            <div key={t.id} style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(201,168,76,.15)",
              borderRadius: 14, marginBottom: 16, overflow: "hidden"
            }}>
              {/* Table header */}
              <div style={{
                padding: "12px 16px",
                background: "rgba(201,168,76,.05)",
                borderBottom: "1px solid rgba(201,168,76,.1)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: sc + "22", border: "1.5px solid " + sc + "55",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: sc
                  }}>{t.id}</div>
                  <div>
                    {t.label && t.label !== "__extra__" && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{t.label}</div>
                    )}
                    {t.side && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: sc + "22", color: sc }}>
                        {t.side}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isFull ? "#50c878" : gold }}>
                    {occ} / {t.seats || 8}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>nəfər</div>
                </div>
              </div>

              {/* Guests */}
              <div style={{ padding: "10px 14px" }}>
                {t.guests.map((g, gi) => (
                  <div key={g.id} style={{
                    display: "flex", gap: 8, alignItems: "center",
                    padding: "8px 0",
                    borderBottom: gi < t.guests.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none"
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: gold
                    }}>{gi + 1}</div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        placeholder="Ad Soyad"
                        value={g.name}
                        onChange={e => updateGuest(t.id, g.id, "name", e.target.value)}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          placeholder="Telefon (istəyə görə)"
                          value={g.phone || ""}
                          onChange={e => updateGuest(t.id, g.id, "phone", e.target.value)}
                          style={{ flex: 2 }}
                        />
                        <select
                          value={g.count || 1}
                          onChange={e => updateGuest(t.id, g.id, "count", parseInt(e.target.value))}
                          style={{ flex: 1 }}
                        >
                          {[1,2,3,4,5].map(n => (
                            <option key={n} value={n}>{n} nəfər</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => removeGuest(t.id, g.id)}
                      style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        border: "none", background: "rgba(255,60,60,.1)",
                        color: "rgba(255,100,100,.6)", fontSize: 14,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>✕</button>
                  </div>
                ))}

                {/* Add guest button */}
                {occ < (t.seats || 8) && (
                  <button
                    onClick={() => addGuest(t.id)}
                    style={{
                      width: "100%", marginTop: 10, padding: "9px",
                      borderRadius: 9, border: "1px dashed rgba(201,168,76,.3)",
                      background: "transparent", color: "rgba(201,168,76,.6)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer"
                    }}>
                    + Qonaq əlavə et
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {tables.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.3)", fontSize: 13 }}>
            Bu dəvətdə masa tapılmadı.
          </div>
        )}
      </div>

      {/* Save button — fixed bottom */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "12px 16px 28px",
        background: "rgba(8,6,4,.97)",
        borderTop: "1px solid rgba(201,168,76,.15)"
      }}>
        <button
          onClick={handleSave}
          disabled={saving || filledSeats === 0}
          style={{
            width: "100%", padding: "14px",
            borderRadius: 12, border: "none",
            background: saving || filledSeats === 0
              ? "rgba(201,168,76,.1)"
              : "linear-gradient(90deg, rgba(201,168,76,.6), rgba(201,168,76,.35))",
            color: saving || filledSeats === 0 ? "rgba(201,168,76,.3)" : gold,
            fontSize: 14, fontWeight: 800, cursor: saving || filledSeats === 0 ? "not-allowed" : "pointer",
            letterSpacing: 0.5
          }}>
          {saving ? "⏳ Saxlanılır..." : "✅ Yadda Saxla — Məclisə Göndər"}
        </button>
        {filledSeats === 0 && (
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,.25)" }}>
            Ən azı 1 qonaq əlavə edin
          </div>
        )}
      </div>
    </div>
  );
}
