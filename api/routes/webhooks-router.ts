import { Router } from "express";

export const webhooksRouter = Router();

// WhatsApp Cloud API challenge verification
webhooksRouter.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "fixhub-whatsapp-verify-token";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: "Verification token mismatch" });
});

// WhatsApp incoming webhook notifications
webhooksRouter.post("/whatsapp", (req, res) => {
  const body = req.body;
  // Acknowledge Meta webhook quickly with 200 OK
  return res
    .status(200)
    .json({ status: "received", eventsCount: Array.isArray(body?.entry) ? body.entry.length : 1 });
});
