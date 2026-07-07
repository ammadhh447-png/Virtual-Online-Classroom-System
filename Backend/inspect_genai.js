(async () => {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set in env");
    const ai = new GoogleGenAI({ apiKey });
    console.log("AI models module keys:", Object.keys(ai.models));
    console.log(
      "AI models prototype methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(ai.models)).filter(
        (k) => typeof ai.models[k] === "function",
      ),
    );
  } catch (err) {
    console.error("Inspect error:", err);
    process.exit(1);
  }
})();
