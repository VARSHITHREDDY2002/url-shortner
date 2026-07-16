import db from "./db/index.js";
import {generateShortCode} from "./utils/shortid.js"
import express from "express";

const app = express();
const PORT = process.env["PORT"] ?? 3002;

app.use(express.json());

app.post("/shorten", (req, res) => {
  try {
    const { url, customalias } = req.body as { url: string; customalias?: string };

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    if (customalias) {
      const existingAlias = db
        .prepare("SELECT 1 FROM links WHERE code = ?")
        .get(customalias);

      if (existingAlias) {
        return res.status(409).json({ error: "Custom alias already taken" });
      }

      const existingUrl = db
        .prepare("SELECT code, url FROM links WHERE url = ?")
        .get(url) as { code: string; url: string } | undefined;

      if (existingUrl) {
        return res.json({ code: existingUrl.code, url: existingUrl.url });
      }

      db.prepare("INSERT INTO links (code, url) VALUES (?, ?)").run(customalias, url);
      return res.status(201).json({ code: customalias, url });
    }

    let code = generateShortCode();
    while (db.prepare("SELECT 1 FROM links WHERE code = ?").get(code)) {
      code = generateShortCode();
    }

    db.prepare("INSERT INTO links (code, url) VALUES (?, ?)").run(code, url);
    return res.status(201).json({ code, url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
