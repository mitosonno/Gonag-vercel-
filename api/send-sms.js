export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const { phone, text } = req.body;
    if (!phone || !text) { res.status(400).json({ error: "phone and text required" }); return; }

    // Nömrəni normallaşdır — MSM formatı: 994501234567 (ölkə kodu + operator + nömrə, "+" və boşluqsuz)
    let gsm = String(phone).replace(/\D/g, "");
    if (gsm.startsWith("00994")) gsm = gsm.slice(2);
    if (gsm.startsWith("0")) gsm = "994" + gsm.slice(1);
    if (!gsm.startsWith("994")) gsm = "994" + gsm;

    const username = process.env.MSM_USERNAME;
    const apikey = process.env.MSM_APIKEY;
    const sender = process.env.MSM_SENDER || "MSM";

    if (!username || !apikey) {
      res.status(500).json({ error: "MSM_USERNAME / MSM_APIKEY Vercel-də təyin olunmayıb" });
      return;
    }

    const url = "https://v1.msm.az/sendsms?user=" + encodeURIComponent(username)
      + "&password=" + encodeURIComponent(apikey)
      + "&gsm=" + encodeURIComponent(gsm)
      + "&from=" + encodeURIComponent(sender)
      + "&text=" + encodeURIComponent(text);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isAbort = fetchErr.name === "AbortError";
      res.status(504).json({ ok: false, error: isAbort ? "MSM.az serveri 8 saniyə ərzində cavab vermədi (timeout)" : ("MSM.az-a qoşula bilmədi: " + fetchErr.message) });
      return;
    }
    clearTimeout(timeoutId);
    const raw = await response.text();

    // Cavab formatı: errno=100&errtext=OK&message_id=526973&charge=1&balance=123
    const parsed = {};
    raw.split("&").forEach(pair => {
      const [k, v] = pair.split("=");
      if (k) parsed[k] = decodeURIComponent(v || "");
    });

    const ok = parsed.errno === "100";
    res.status(ok ? 200 : 400).json({ ok, gsm, ...parsed, raw });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
