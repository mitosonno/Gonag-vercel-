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
  if (!res.ok) { const e = await res.text(); console.error("SB:", e); return null; }
  try { return await res.json(); } catch { return null; }
}

function occ(t) {
  return (t.guests || []).reduce((s, g) => s + (g.count || 1), 0);
}

function TableSVG({ table, size = 80 }) {
  const S = size;
  const r = S / 2;
  const seats = table.seats || 8;
  const filled = occ(table);
  const pct = Math.min(1, filled / seats);
  const isFull = filled >= seats;
  const side = table.side || "";
  const indColor = isFull ? "#50c878" : pct > 0.5 ? "#f5a623" : pct > 0 ? "#f5d060" : "#e8c060";
  const strokeColor = isFull ? "#50c878" : side === "Oğlan evi" ? "#7aade8" : side === "Qız evi" ? "#e87aad" : indColor;
  const fillBg = isFull ? "#0f3a20" : side === "Oğlan evi" ? "#1e3a55" : side === "Qız evi" ? "#4a1e35" : "#3a2c0a";
  const chairR = r + S * 0.18;
  const chairW = Math.max(4, S * 0.13);
  const chairH = Math.max(3, S * 0.09);
  const totalSize = S + S * 0.5;
  const cx = totalSize / 2;
  const cy = totalSize / 2;

  return (
    <svg width={totalSize} height={totalSize} style={{ display: "block", overflow: "visible" }}>
      {Array.from({ length: seats }).map((_, i) => {
        const angle = (2 * Math.PI / seats) * i - Math.PI / 2;
        const sx = cx + chairR * Math.cos(angle);
        const sy = cy + chairR * Math.sin(angle);
        const f = i < filled;
        const cc = f ? "#4ade80" : side === "Oğlan evi" ? "#93c5fd" : side === "Qız evi" ? "#f9a8d4" : "#fcd34d";
        return (
          <rect key={i}
            x={sx - chairW / 2} y={sy - chairH / 2}
            width={chairW} height={chairH}
            rx={Math.max(1, chairH * 0.4)}
            fill={cc} opacity={f ? 0.95 : 0.3}
            transform={`rotate(${(angle * 180 / Math.PI) + 90} ${sx} ${sy})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r - 2} fill={fillBg} stroke={strokeColor} strokeWidth="2.5"
        style={{ filter: `drop-shadow(0 0 4px ${strokeColor}99)` }} />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.max(10, S * 0.24)} fontWeight="800" fill={strokeColor}>
        {table.id}
      </text>
      <text x={cx} y={cy + S * 0.14} textAnchor="middle"
        fontSize={Math.max(7, S * 0.13)} fill="rgba(255,255,255,.45)">
        {filled}/{seats}
      </text>
    </svg>
  );
}

function GuestEditPopup({ guest, tableId, allTables, onSave, onDelete, onMove, onClose }) {
  const [name, setName] = useState(guest.name || "");
  const [phone, setPhone] = useState(guest.phone || "");
  const [count, setCount] = useState(String(guest.count || 1));
  const [moveTo, setMoveTo] = useState("");
  const [mode, setMode] = useState("edit");

  const inputStyle = {
    background: "rgba(255,255,255,.07)", border: "1px solid rgba(201,168,76,.25)",
    borderRadius: 8, padding: "10px 12px", color: "#f2e8d0", fontSize: 13,
    outline: "none", fontFamily: "inherit", width: "100%"
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", background: "#0e0a04", borderTop: "1px solid rgba(201,168,76,.25)", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(201,168,76,.25)", margin: "0 auto 16px" }} />

        {mode === "edit" ? (
          <>
            <div style={{ fontSize: 13, color: "#c9a84c", fontWeight: 700, marginBottom: 14 }}>✏️ Qonağı redaktə et</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              <input style={inputStyle} placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...inputStyle, flex: 2 }} placeholder="Telefon" value={phone} onChange={e => setPhone(e.target.value)} />
                <select style={{ ...inputStyle, flex: 1 }} value={count} onChange={e => setCount(e.target.value)}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} nəfər</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onSave({ ...guest, name: name.trim(), phone: phone.trim(), count: parseInt(count) || 1 })}
                style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "rgba(201,168,76,.2)", color: "#c9a84c", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✓ Saxla
              </button>
              <button onClick={() => setMode("move")}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid rgba(122,173,232,.3)", background: "rgba(122,173,232,.08)", color: "#7aade8", fontSize: 12, cursor: "pointer" }}>
                ↔ Köçür
              </button>
              <button onClick={() => onDelete(guest.id)}
                style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,80,80,.3)", background: "rgba(255,80,80,.08)", color: "#ff8888", fontSize: 14, cursor: "pointer" }}>
                🗑
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "#7aade8", fontWeight: 700, marginBottom: 12 }}>↔ Hansı masaya köçürəsən?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, maxHeight: 240, overflowY: "auto" }}>
              {allTables.filter(t => t.id !== tableId).map(t => (
                <button key={t.id} onClick={() => setMoveTo(String(t.id))}
                  style={{ padding: "10px 14px", borderRadius: 10, textAlign: "left", border: moveTo === String(t.id) ? "1px solid #7aade8" : "1px solid rgba(255,255,255,.1)", background: moveTo === String(t.id) ? "rgba(122,173,232,.15)" : "transparent", color: "#f2e8d0", fontSize: 13, cursor: "pointer" }}>
                  Masa {t.id}{t.label && t.label !== "__extra__" ? ` — ${t.label}` : ""} ({occ(t)}/{t.seats || 8})
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (moveTo) onMove(guest.id, tableId, parseInt(moveTo)); }} disabled={!moveTo}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: moveTo ? "rgba(122,173,232,.2)" : "rgba(255,255,255,.05)", color: moveTo ? "#7aade8" : "rgba(255,255,255,.2)", fontSize: 13, fontWeight: 700, cursor: moveTo ? "pointer" : "default" }}>
                ↔ Köçür
              </button>
              <button onClick={() => setMode("edit")}
                style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(255,255,255,.3)", fontSize: 12, cursor: "pointer" }}>
                Geri
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  const { code } = useParams();
  const [status, setStatus] = useState("loading");
  const [inviteData, setInviteData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [tables, setTables] = useState([]);
  const [savedTables, setSavedTables] = useState(new Set());
  const [savingTable, setSavingTable] = useState(null);
  const [editPopup, setEditPopup] = useState(null);

  useEffect(() => { if (code) loadInvite(); else setStatus("error"); }, [code]);

  async function loadInvite() {
    setStatus("loading");
    try {
      const links = await sbFetch("invite_links?code=eq." + encodeURIComponent(code) + "&limit=1");
      if (!links || !links.length) { setStatus("error"); return; }
      const link = links[0];
      setInviteData(link);
      const events = await sbFetch("events?session_id=eq." + encodeURIComponent(link.session_id) + "&order=created_at.desc&limit=1");
      if (!events || !events.length) { setStatus("error"); return; }
      const ev = events[0];
      setEventData(ev);
      const allRows = (ev.tables && ev.tables.rows) ? ev.tables.rows : [];
      const tblIds = link.table_ids || [];
      const myTables = allRows.filter(t => tblIds.includes(t.id)).sort((a, b) => a.id - b.id).map(t => ({ ...t, guests: (t.guests || []).map(g => ({ ...g })) }));
      setTables(myTables);
      setStatus("ready");
    } catch (e) { console.error(e); setStatus("error"); }
  }

  function addGuest(tblId) {
    setTables(prev => prev.map(t => {
      if (t.id !== tblId || occ(t) >= (t.seats || 8)) return t;
      return { ...t, guests: [...t.guests, { id: "inv_" + Date.now() + Math.random(), name: "", phone: "", count: 1, gender: "", invited: false }] };
    }));
  }

  function saveGuestEdit(updatedGuest) {
    setTables(prev => prev.map(t => t.id !== editPopup.tableId ? t : { ...t, guests: t.guests.map(g => g.id === updatedGuest.id ? updatedGuest : g) }));
    setEditPopup(null);
  }

  function deleteGuest(guestId) {
    setTables(prev => prev.map(t => t.id !== editPopup.tableId ? t : { ...t, guests: t.guests.filter(g => g.id !== guestId) }));
    setEditPopup(null);
  }

  function moveGuest(guestId, fromId, toId) {
    setTables(prev => {
      const g = prev.find(t => t.id === fromId)?.guests.find(g => g.id === guestId);
      if (!g) return prev;
      return prev.map(t => {
        if (t.id === fromId) return { ...t, guests: t.guests.filter(gg => gg.id !== guestId) };
        if (t.id === toId) return { ...t, guests: [...t.guests, { ...g }] };
        return t;
      });
    });
    setEditPopup(null);
  }

  async function saveTable(tblId) {
    if (!eventData) return;
    setSavingTable(tblId);
    try {
      const allRows = (eventData.tables && eventData.tables.rows) ? [...eventData.tables.rows] : [];
      const myT = tables.find(t => t.id === tblId);
      const updatedRows = allRows.map(t => t.id === tblId ? { ...t, guests: myT.guests } : t);
      const newTablesObj = { ...(eventData.tables || {}), rows: updatedRows };
      await sbFetch("events?id=eq." + eventData.id, {
        method: "PATCH",
        prefer: "return=representation",
        body: JSON.stringify({ tables: newTablesObj, updated_at: new Date().toISOString() })
      });
      setEventData(prev => ({ ...prev, tables: newTablesObj }));
      setSavedTables(prev => new Set([...prev, tblId]));
    } catch (e) { console.error(e); }
    setSavingTable(null);
  }

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#080604", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎊</div>
        <div style={{ color: "#c9a84c", fontSize: 14, fontWeight: 600 }}>Yüklənir...</div>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", background: "#080604", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ color: "#ff9999", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Link tapılmadı</div>
        <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Dəvəti göndərən şəxslə əlaqə saxlayın.</div>
      </div>
    </div>
  );

  const evName = eventData?.couple || "Məclis";

  return (
    <div style={{ minHeight: "100vh", background: "#080604", fontFamily: "'DM Sans', sans-serif", color: "#f2e8d0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        select option { background: #1a1208; color: #f2e8d0; }
      `}</style>

      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(201,168,76,.12)", background: "rgba(201,168,76,.04)" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#c9a84c", letterSpacing: 2 }}>
          GONAG<span style={{ color: "#f2e8d0", fontStyle: "italic" }}>.AZ</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 2 }}>🎊 {evName} — {tables.length} masa dəvəti</div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "16px 14px 60px" }}>
        {tables.map(t => {
          const filled = occ(t);
          const seats = t.seats || 8;
          const isFull = filled >= seats;
          const isSaved = savedTables.has(t.id);
          const isSaving = savingTable === t.id;
          const sc = t.side === "Oğlan evi" ? "#7aade8" : t.side === "Qız evi" ? "#e87aad" : "#c9a84c";

          return (
            <div key={t.id} style={{ background: "rgba(255,255,255,.02)", border: `1px solid ${isFull ? "rgba(80,200,120,.4)" : "rgba(201,168,76,.15)"}`, borderRadius: 16, marginBottom: 20, transition: "border-color .4s" }}>

              {/* Header: SVG + info */}
              <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <TableSVG table={t} size={80} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: isFull ? "#50c878" : sc }}>Masa {t.id}</span>
                    {t.label && t.label !== "__extra__" && <span style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>{t.label}</span>}
                    {isFull && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "rgba(80,200,120,.18)", color: "#50c878", fontWeight: 700 }}>✓ Dolu</span>}
                  </div>
                  {t.side && <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: sc + "22", color: sc, display: "inline-block", marginBottom: 4 }}>{t.side}</div>}
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{filled}/{seats} nəfər</div>
                </div>
              </div>

              {/* Guests */}
              <div style={{ padding: "8px 14px" }}>
                {t.guests.length === 0 && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.22)", padding: "10px 0", textAlign: "center" }}>Hələ qonaq əlavə edilməyib</div>
                )}
                {t.guests.map((g, gi) => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: gi < t.guests.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#c9a84c" }}>{gi + 1}</div>
                    <input
                      placeholder="Ad Soyad"
                      value={g.name}
                      onChange={e => {
                        const val = e.target.value;
                        setTables(prev => prev.map(tbl => tbl.id !== t.id ? tbl : { ...tbl, guests: tbl.guests.map(gg => gg.id !== g.id ? gg : { ...gg, name: val }) }));
                      }}
                      style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 8, padding: "8px 11px", color: "#f2e8d0", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                    />
                    {g.count > 1 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#c9a84c", background: "rgba(201,168,76,.12)", borderRadius: 6, padding: "3px 6px", flexShrink: 0 }}>{g.count}x</span>
                    )}
                    <button onClick={() => setEditPopup({ guest: g, tableId: t.id })}
                      style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, border: "1px solid rgba(201,168,76,.18)", background: "rgba(201,168,76,.06)", color: "rgba(201,168,76,.7)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✏️
                    </button>
                  </div>
                ))}

                {filled < seats && (
                  <button onClick={() => addGuest(t.id)}
                    style={{ width: "100%", marginTop: 10, padding: "9px", borderRadius: 9, border: "1px dashed rgba(201,168,76,.28)", background: "transparent", color: "rgba(201,168,76,.55)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    + Qonaq əlavə et
                  </button>
                )}
              </div>

              {/* Per-table save */}
              <div style={{ padding: "8px 14px 14px" }}>
                <button onClick={() => saveTable(t.id)} disabled={isSaving || t.guests.length === 0}
                  style={{
                    width: "100%", padding: "11px", borderRadius: 10, border: "none",
                    background: isSaved ? "rgba(80,200,120,.18)" : t.guests.length === 0 ? "rgba(255,255,255,.03)" : "rgba(201,168,76,.16)",
                    color: isSaved ? "#50c878" : t.guests.length === 0 ? "rgba(255,255,255,.18)" : "#c9a84c",
                    fontSize: 12, fontWeight: 700,
                    cursor: isSaving || t.guests.length === 0 ? "default" : "pointer",
                    transition: "all .3s"
                  }}>
                  {isSaving ? "⏳ Saxlanılır..." : isSaved ? "✅ Saxlanıldı — Yenidən saxla" : "💾 Bu Masanı Yadda Saxla"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editPopup && (
        <GuestEditPopup
          guest={editPopup.guest}
          tableId={editPopup.tableId}
          allTables={tables}
          onSave={saveGuestEdit}
          onDelete={deleteGuest}
          onMove={moveGuest}
          onClose={() => setEditPopup(null)}
        />
      )}
    </div>
  );
}
