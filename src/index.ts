import db from "./db/index.js";
import {generateShortCode} from "./utils/shortid.js"
import express from "express";

const app = express();
const PORT = process.env["PORT"] ?? 3002;

app.use(express.json());

app.post("/shorten", (req, res) => {
  try {
    const { url, customalias } = req.body as {
      url?: string;
      customalias?: string;
    };

    // URL is required
    if (!url) {
      return res.status(400).json({
        error: "URL is required",
      });
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return res.status(400).json({
        error: "Invalid URL",
      });
    }

    // Validate alias (optional)
    if (
      customalias &&
      !/^[A-Za-z0-9_-]{3,20}$/.test(customalias)
    ) {
      return res.status(400).json({
        error:
          "Alias must contain only letters, numbers, '-' or '_' and be 3-20 characters long.",
      });
    }

    // Check if URL already exists
    const existingUrl = db
      .prepare("SELECT code, url FROM links WHERE url = ?")
      .get(url) as { code: string; url: string } | undefined;

    // URL already exists
    if (existingUrl) {
      // No alias -> return existing short URL
      if (!customalias) {
        return res.status(200).json(existingUrl);
      }

      // Alias provided
      const aliasExists = db
        .prepare("SELECT 1 FROM links WHERE code = ?")
        .get(customalias);

      if (aliasExists) {
        return res.status(409).json({
          error: "Custom alias already taken",
        });
      }

      // Create another mapping for the same URL
      db.prepare(
        "INSERT INTO links(code, url) VALUES(?, ?)"
      ).run(customalias, url);

      return res.status(201).json({
        code: customalias,
        url,
      });
    }

    // New URL

    let code = customalias;

    // Generate code if alias wasn't provided
    if (!code) {
      do {
        code = generateShortCode();
      } while (
        db.prepare("SELECT 1 FROM links WHERE code = ?").get(code)
      );
    } else {
      // Alias provided -> ensure unique
      const aliasExists = db
        .prepare("SELECT 1 FROM links WHERE code = ?")
        .get(code);

      if (aliasExists) {
        return res.status(409).json({
          error: "Custom alias already taken",
        });
      }
    }

    db.prepare(
      "INSERT INTO links(code, url) VALUES(?, ?)"
    ).run(code, url);

    return res.status(201).json({
      code,
      url,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.get("/:code", (req, res) => {
  const { code } = req.params;

  const link = db
      .prepare("SELECT url FROM links WHERE code = ?")
      .get(code) as { url: string } | undefined;

  if (!link) {
      return res.status(404).json({
          error: "Short URL not found",
      });
  }

  return res.redirect(301, link.url);
});

export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export default app;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
