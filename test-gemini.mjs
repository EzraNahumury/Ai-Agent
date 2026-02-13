import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

try {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent("Halo, ini test Gemini API.");
  const text = result.response.text();

  console.log("✅ Gemini OK:");
  console.log(text);
} catch (err) {
  console.error("❌ Gemini ERROR:");
  console.error(err?.message || err);
}
