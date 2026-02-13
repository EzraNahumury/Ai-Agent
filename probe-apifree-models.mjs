import fetch from "node-fetch";

const API_KEY = process.env.APIFREE_API_KEY;
const BASE_URL = "https://api.apifree.ai/v1";

const candidates = [
  // OpenAI-ish aliases yang sering dipakai provider proxy
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
  "gpt-4-turbo",
  "gpt-3.5-turbo",

  // Provider lain (kadang APIFree support)
  "claude-3-5-sonnet",
  "claude-3-opus",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "deepseek-chat",
  "deepseek-reasoner",
];

async function tryModel(model) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Test. Balas satu kata: OK" }],
      max_tokens: 10,
    }),
  });

  const text = await res.text();

  let data = null;
  try { data = JSON.parse(text); } catch {}

  // APIFree kadang error-nya dibungkus dengan code/error walau HTTP 200
  const hasError = !!(data?.error || (data?.code && data?.code !== 200 && data?.code !== 0));

  if (!res.ok || hasError) {
    const msg = data?.error?.message || data?.error?.code || text;
    return { ok: false, model, status: res.status, msg };
  }

  const out =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.output_text ??
    null;

  return { ok: !!out, model, status: res.status, out: out ?? "(no output field)" };
}

(async () => {
  for (const m of candidates) {
    const r = await tryModel(m);
    if (r.ok) {
      console.log("✅ MODEL OK:", r.model);
      console.log("Output:", r.out);
      process.exit(0);
    } else {
      console.log("❌", r.model, "|", r.status, "|", r.msg);
    }
  }
  console.log("\n⚠️ Tidak ada model kandidat yang cocok.");
  console.log("Solusi: cek daftar model di dashboard APIFree (biasanya ada di halaman API Keys / Docs).");
})();
