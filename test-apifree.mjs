import fetch from "node-fetch";

const API_KEY = process.env.APIFREE_API_KEY;
const BASE_URL = "https://api.apifree.ai/v1";

async function test() {
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Halo, ini test APIFree" }],
        max_tokens: 50,
      }),
    });

    const text = await res.text();
    console.log("HTTP Status:", res.status);
    console.log("RAW RESPONSE:\n", text);

    // coba parse JSON kalau memungkinkan
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Response bukan JSON. Cek RAW RESPONSE di atas.");
      return;
    }

    // Handle beberapa kemungkinan format
    const out =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.output_text ??
      data?.data?.choices?.[0]?.message?.content ??
      null;

    if (!res.ok) {
      console.error("❌ APIFree ERROR JSON:");
      console.error(data);
      return;
    }

    if (!out) {
      console.error("⚠️ Request sukses, tapi format respons tidak dikenali.");
      console.error("Parsed JSON:", data);
      return;
    }

    console.log("\n✅ APIFree OUTPUT:\n", out);
  } catch (err) {
    console.error("❌ Request FAILED:");
    console.error(err?.message || err);
  }
}

test();
