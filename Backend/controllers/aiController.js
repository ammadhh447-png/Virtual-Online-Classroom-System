// Use global fetch when available (Node 18+). Fall back to dynamic import of node-fetch if needed.
let fetcher = global.fetch;
if (!fetcher) {
  fetcher = async (...args) => {
    const mod = await import("node-fetch");
    return mod.default(...args);
  };
}
const User = require("../models/User");
const StudentSubmission = require("../models/StudentSubmission");
const StudentQuizSubmission = require("../models/StudentQuizSubmission");
const Meeting = require("../models/Meeting");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// POST /api/ai/chat
// body: { message }
// optional file upload field: file
exports.chat = async (req, res) => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiUrl || !apiKey) {
      return res.status(500).json({
        message:
          "AI API not configured on server. Set GEMINI_API_URL and GEMINI_API_KEY.",
      });
    }

    // If the URL is still the placeholder (common when .env values are example text), short-circuit with a helpful error
    if (
      apiUrl.includes("example") ||
      apiUrl.includes("replace_me") ||
      apiUrl.includes("your_api")
    ) {
      return res.status(500).json({
        message:
          "GEMINI_API_URL appears to be a placeholder. Please set a valid GEMINI_API_URL in Backend/.env to enable AI, or remove the key to disable AI features.",
      });
    }

    const { message } = req.body;
    const userId = req.user?.id;

    // Build context: user profile, recent submissions, upcoming meetings
    const user = userId
      ? await User.findById(userId).select("-password").lean()
      : null;

    const submissions = userId
      ? await StudentSubmission.find({ studentId: userId })
          .sort({ submittedAt: -1 })
          .limit(20)
          .lean()
      : [];
    const quizSubs = userId
      ? await StudentQuizSubmission.find({ studentId: userId })
          .sort({ submittedAt: -1 })
          .limit(20)
          .lean()
      : [];
    const meetings = user
      ? await Meeting.find({
          year: user.rollYear,
          department: user.rollDept,
          section: user.section,
          startsAt: { $gte: new Date() },
        })
          .sort({ startsAt: 1 })
          .limit(10)
          .lean()
      : [];

    // If file uploaded, store to cloudinary and include URL
    let uploadedFileUrl = null;
    if (req.file) {
      const streamUpload = (fileBuffer, filename) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "ai_uploads",
              resource_type: "raw",
              public_id: `${Date.now()}-${filename}`,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            },
          );
          streamifier.createReadStream(fileBuffer).pipe(stream);
        });

      try {
        uploadedFileUrl = await streamUpload(
          req.file.buffer,
          req.file.originalname,
        );
      } catch (err) {
        console.error("Cloudinary upload failed", err);
      }
    }

    // Build a prompt context for the model
    const parts = [];
    if (user)
      parts.push(
        `Student: ${user.name} (roll: ${user.rollYear}-${user.rollDept}-${user.section})`,
      );
    if (submissions.length)
      parts.push(
        `Recent assignment submissions: ${submissions
          .slice(0, 5)
          .map(
            (s) =>
              `${s.assignmentTitle || s.assignmentId || s._id} (marks:${s.marks ?? "N/A"})`,
          )
          .join("; ")}`,
      );
    if (quizSubs.length)
      parts.push(
        `Recent quiz submissions: ${quizSubs
          .slice(0, 5)
          .map(
            (s) =>
              `${s.quizTitle || s.quizId || s._id} (marks:${s.marks ?? "N/A"})`,
          )
          .join("; ")}`,
      );
    if (meetings.length)
      parts.push(
        `Upcoming meetings: ${meetings
          .slice(0, 5)
          .map((m) => `${m.title} at ${m.startsAt}`)
          .join("; ")}`,
      );
    if (uploadedFileUrl) parts.push(`Attached file: ${uploadedFileUrl}`);

    parts.push(`User question: ${message}`);

    const prompt = parts.join("\n\n");

    // If configured for Google Generative Language API, use the official SDK for correct request shape
    const isGoogle =
      apiUrl && apiUrl.includes("generativelanguage.googleapis.com");
    const useMock = process.env.AI_MOCK === "true";

    if (isGoogle) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        console.log("Using GenAI model:", model);

        // Add timeout wrapper (30 seconds)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("API request timeout after 30 seconds")),
            30000,
          ),
        );

        const gen = await Promise.race([
          ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
          timeoutPromise,
        ]);

        // Extract reply text robustly for different SDK response shapes
        let reply = "";
        try {
          if (typeof gen?.text === "string" && gen.text.trim()) {
            reply = gen.text;
          } else {
            const candidate = gen?.candidates?.[0] || null;
            if (candidate) {
              // candidate.content may be an object with `parts` array or an array itself
              const content = candidate.content;
              if (content) {
                if (Array.isArray(content)) {
                  reply = content.map((c) => (c?.text ? c.text : "")).join("");
                } else if (Array.isArray(content.parts)) {
                  reply = content.parts.map((p) => p?.text || "").join("");
                } else if (typeof content === "string") {
                  reply = content;
                }
              }

              if (!reply && Array.isArray(candidate.output)) {
                reply = candidate.output.map((o) => o?.text || "").join("");
              }

              if (!reply && typeof candidate.text === "string") {
                reply = candidate.text;
              }
            }
          }
        } catch (extractErr) {
          console.error(
            "Failed to extract text from GenAI response",
            extractErr,
          );
        }

        // Fallback: stringify but try to keep it human readable
        if (!reply) {
          try {
            // If gen has nested text parts, attempt a safer join
            if (gen && typeof gen === "object")
              reply = JSON.stringify(gen, null, 2);
            else reply = String(gen);
          } catch (stringErr) {
            reply = String(gen);
          }
        }

        return res.json({ reply });
      } catch (sdkErr) {
        console.error("Google GenAI SDK error", sdkErr);

        // Check for timeout/network errors
        if (
          sdkErr?.message?.includes("timeout") ||
          sdkErr?.code === "ETIMEDOUT" ||
          sdkErr?.cause?.code === "ETIMEDOUT"
        ) {
          if (useMock) {
            const mockReply = `Mock reply (API timeout). Context:\n${prompt.slice(0, 1000)}\n\n(Try again - temporary network issue)`;
            return res.json({ reply: mockReply });
          }
          return res.status(503).json({
            message:
              "AI service is temporarily unavailable (timeout). Please try again in a moment.",
            error: "API_TIMEOUT",
          });
        }

        if (useMock) {
          const mockReply = `Mock reply (AI service unavailable). Context:\n${prompt.slice(0, 1000)}\n\n(Enable a real GEMINI_API_URL and GEMINI_API_KEY to use the live model)`;
          return res.json({ reply: mockReply });
        }

        // If the SDK reports the model is not found (404) or suggests calling ListModels,
        // try to list available models and return them to help the operator choose a valid GEMINI_MODEL.
        try {
          const message = sdkErr?.message || String(sdkErr);
          const isModelNotFound =
            sdkErr?.status === 404 ||
            (typeof message === "string" && message.includes("ListModels"));
          if (isModelNotFound) {
            let available = null;
            try {
              // Use correct SDK method `ai.models.list()` and extract available models for error response
              const pager = await ai.models.list();
              const firstPage =
                (await pager.asArray?.()) || pager?.models || [];
              if (Array.isArray(firstPage)) {
                available = firstPage.map((m) => ({
                  name: m.name || m,
                  description: m.description || null,
                }));
              } else if (pager?.models) {
                available = (pager.models || []).map((m) => ({
                  name: m.name,
                  description: m.description || null,
                }));
              }
            } catch (listErr) {
              console.error("ListModels failed", listErr);
            }

            return res.status(502).json({
              message:
                "Requested model not available for this API version. Set GEMINI_MODEL to one of the supported models returned in `availableModels`.",
              detail: message,
              availableModels: available,
            });
          }
        } catch (probeErr) {
          console.error("Model-availability probe failed", probeErr);
        }

        return res.status(502).json({
          message: "Google GenAI error",
          detail: sdkErr?.message || String(sdkErr),
        });
      }
    }

    // Fallback for non-Google providers: POST { prompt }
    try {
      const response = await fetcher(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("AI API error", text);
        return res
          .status(502)
          .json({ message: "AI provider returned an error", detail: text });
      }

      const data = await response.json();
      const reply =
        data.reply || data.output || data.text || JSON.stringify(data);
      return res.json({ reply });
    } catch (fetchErr) {
      console.error("AI provider fetch failed", fetchErr);
      if (useMock) {
        const mockReply = `Mock reply (AI service unavailable). Context:\n${prompt.slice(0, 1000)}\n\n(Enable a real GEMINI_API_URL and GEMINI_API_KEY to use the live model)`;
        return res.json({ reply: mockReply });
      }
      return res.status(502).json({
        message:
          "Failed to contact AI provider. Check GEMINI_API_URL, GEMINI_API_KEY and network connectivity.",
        detail: fetchErr.message,
      });
    }
  } catch (err) {
    console.error("AI chat error", err);
    res.status(500).json({ message: "Server error" });
  }
};
