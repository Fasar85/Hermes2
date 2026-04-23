import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/save-database", (req, res) => {
    try {
      const dbData = req.body;
      fs.writeFileSync(path.join(__dirname, "database.json"), JSON.stringify(dbData, null, 2));
      res.json({ status: "success", message: "Database salvato correttamente." });
    } catch (error) {
      console.error("Errore nel salvataggio del database:", error);
      res.status(500).json({ status: "error", message: "Errore nel salvataggio del file." });
    }
  });

  app.get("/api/load-database", (req, res) => {
    try {
      const dbPath = path.join(__dirname, "database.json");
      if (fs.existsSync(dbPath)) {
        const dbData = fs.readFileSync(dbPath, "utf-8");
        res.json(JSON.parse(dbData));
      } else {
        res.status(404).json({ status: "error", message: "Nessun database trovato." });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: "Errore nel caricamento del file." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
