export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) { res.status(400).json({ error: "audioBase64 required" }); return; }

    const buffer = Buffer.from(audioBase64, "base64");
    const blob = new Blob([buffer], { type: mimeType || "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "az");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + process.env.OPENAI_API_KEY },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(500).json({ error: errText });
      return;
    }

    const data = await response.json();
    res.status(200).json({ text: (data.text || "").trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
