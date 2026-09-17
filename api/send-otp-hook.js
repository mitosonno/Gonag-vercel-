// Supabase "Send SMS Hook" — telefon OTP kodlarını bizim mövcud MSM.az sistemi ilə göndərir.
// Supabase-in bunu necə çağırdığı: Authentication -> Hooks -> Send SMS Hook bölməsində
// bu faylın canlı ünvanını (https://.../api/send-otp-hook) qeyd etmək lazımdır.
//
// TƏHLÜKƏSİZLİK: Supabase hər sorğunu "Standard Webhooks" imzası ilə göndərir.
// Bu imzanı yoxlamasaq, İSTƏNİLƏN kəs bu ünvana sorğu göndərib bizim MSM.az balansımızdan
// pulsuz SMS göndərə bilər — ona görə SEND_SMS_HOOK_SECRET mütləq təyin olunmalıdır.

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// "v1,whsec_XXXX" formatındakı sirri Standard Webhooks kitabxanasının gözlədiyi
// xam base64 açara çevirir (əlavə kitabxana yükləmədən, əl ilə HMAC yoxlaması).
import crypto from "crypto";

function verifySignature(secretEnv, rawBody, headers) {
  const secret = String(secretEnv || "").replace(/^v1,whsec_/, "");
  const key = Buffer.from(secret, "base64");
  const id = headers["webhook-id"];
  const ts = headers["webhook-timestamp"];
  const sigHeader = headers["webhook-signature"] || "";
  if (!id || !ts || !sigHeader) throw new Error("Webhook başlıqları çatışmır");

  // 5 dəqiqəlik saat fərqi tolerantlığı (Standard Webhooks tövsiyəsi)
  const tsNum = Number(ts);
  if (!tsNum || Math.abs(Date.now() / 1000 - tsNum) > 300) {
    throw new Error("Webhook vaxtı etibarsızdır (timestamp)");
  }

  const signedContent = `${id}.${ts}.${rawBody}`;
  const expected = crypto.createHmac("sha256", key).update(signedContent).digest("base64");

  const candidates = sigHeader.split(" ").map(p => p.split(",")[1]).filter(Boolean);
  const ok = candidates.some(sig => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch { return false; }
  });
  if (!ok) throw new Error("İmza uyğun gəlmədi");
}

async function sendViaMSM(gsmRaw, text) {
  let gsm = String(gsmRaw).replace(/\D/g, "");
  if (gsm.startsWith("00994")) gsm = gsm.slice(2);
  if (gsm.startsWith("0")) gsm = "994" + gsm.slice(1);
  if (!gsm.startsWith("994")) gsm = "994" + gsm;

  const username = process.env.MSM_USERNAME;
  const apikey = process.env.MSM_APIKEY;
  const sender = process.env.MSM_SENDER || "MSM";
  if (!username || !apikey) throw new Error("MSM_USERNAME / MSM_APIKEY təyin olunmayıb");

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
  } finally {
    clearTimeout(timeoutId);
  }
  const raw = await response.text();
  const parsed = {};
  raw.split("&").forEach(pair => {
    const [k, v] = pair.split("=");
    if (k) parsed[k] = decodeURIComponent(v || "");
  });
  if (parsed.errno !== "100") throw new Error("MSM.az xətası: " + raw);
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({}); return; }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
    verifySignature(process.env.SEND_SMS_HOOK_SECRET, rawBody, req.headers);
  } catch (e) {
    res.status(401).json({ error: { http_code: 401, message: "İmza yoxlaması alınmadı: " + e.message } });
    return;
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch {
    res.status(400).json({ error: { http_code: 400, message: "JSON oxuna bilmədi" } });
    return;
  }

  const phone = payload && payload.user && payload.user.phone;
  const otp = payload && payload.sms && payload.sms.otp;
  if (!phone || !otp) {
    res.status(400).json({ error: { http_code: 400, message: "phone/otp tapılmadı" } });
    return;
  }

  try {
    await sendViaMSM(phone, `QONAQ təsdiq kodunuz: ${otp}`);
  } catch (e) {
    res.status(500).json({ error: { http_code: 500, message: "SMS göndərilmədi: " + e.message } });
    return;
  }

  res.status(200).json({});
}
