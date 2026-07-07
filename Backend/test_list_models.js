(async () => {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set in env");
    const ai = new GoogleGenAI({ apiKey });
    // The SDK exposes `ai.models.list()` which returns a pager. Collect first page.
    const pager = await ai.models.list();
    // Some pager implementations provide asArray(); otherwise fall back to `models` field
    let models = [];
    if (typeof pager.asArray === "function") {
      models = await pager.asArray();
    } else if (Array.isArray(pager)) {
      models = pager;
    } else if (pager?.models) {
      models = pager.models;
    }
    console.log("Available models:");
    console.log(JSON.stringify(models, null, 2));
  } catch (err) {
    console.error("ListModels error:", err);
    process.exit(1);
  }
})();
