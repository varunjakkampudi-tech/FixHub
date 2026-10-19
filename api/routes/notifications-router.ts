import { Router } from "express";
import { defaultRepository } from "../db/repository";
import { authenticate } from "../middleware/auth-middleware";

export const notificationsRouter = Router();

notificationsRouter.get("/", authenticate, (req, res) => {
  const notifs = Array.from(defaultRepository.notifications.values())
    .filter((n) => n.userId === req.user!.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return res.status(200).json({ notifications: notifs, count: notifs.length, requestId: req.id });
});

notificationsRouter.post("/:id/read", authenticate, (req, res) => {
  const id = String(req.params.id);
  const notif = defaultRepository.notifications.get(id);
  if (!notif || notif.userId !== req.user!.userId) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Notification not found." },
      requestId: req.id,
    });
  }
  notif.status = "read";
  return res.status(200).json({ notification: notif, requestId: req.id });
});

notificationsRouter.get("/preferences", authenticate, (req, res) => {
  return res.status(200).json({
    preferences: {
      userId: req.user!.userId,
      channels: {
        whatsapp: true,
        sms: true,
        push: true,
        email: false,
      },
      locale: "en",
    },
    requestId: req.id,
  });
});
