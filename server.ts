import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/notify", async (req, res) => {
    const { name, phone, vehicle, service, priceLabel } = req.body;

    const discordUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!discordUrl) {
      console.warn("Discord Webhook not configured. Skipping notification.");
      return res.status(200).json({ success: true, message: "No notification service configured" });
    }

    try {
      const response = await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: "🏎️ **NEW BOOKING REQUEST** @everyone",
          embeds: [{
            title: "Project Engagement Logged",
            color: 3447003, // Accent blue hex
            fields: [
              { name: "Customer", value: name || "N/A", inline: true },
              { name: "Phone", value: phone || "N/A", inline: true },
              { name: "Vehicle", value: vehicle || "N/A" },
              { name: "Service", value: service || "N/A" },
              { name: "Estimated Total", value: priceLabel || "Custom Quote" }
            ],
            footer: { text: "Precision Mechanical Engine • Booking Terminal v2" },
            timestamp: new Date().toISOString()
          }]
        })
      });

      if (!response.ok) throw new Error(`Discord responded with ${response.status}`);

      console.log("Discord notification sent successfully");
      res.json({ success: true, message: "Discord notification sent" });
    } catch (error) {
      console.error("Notification Error:", error);
      res.status(500).json({ success: false, error: "Failed to send notification" });
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
