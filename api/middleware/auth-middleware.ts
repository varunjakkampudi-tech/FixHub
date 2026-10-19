import { type NextFunction, type Request, type Response } from "express";
import { type TokenPayload, defaultAuthService } from "../services/auth-service";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication token is required." },
      requestId: req.id,
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  const payload = defaultAuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Authentication token is invalid or expired." },
      requestId: req.id,
    });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const payload = defaultAuthService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
        requestId: req.id,
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: `Access denied. Requires one of roles: ${roles.join(", ")}` },
        requestId: req.id,
      });
      return;
    }
    next();
  };
}
