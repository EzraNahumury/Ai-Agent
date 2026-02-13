import fetch from "node-fetch";

const API_KEY = process.env.APIFREE_API_KEY;
const BASE_URL = "https://api.apifree.ai/v1";

async function main() {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  const text = await res.text();
  console.log("HTTP Status:", res.status);
  console.log("RAW RESPONSE:\n", text);
}

main();
