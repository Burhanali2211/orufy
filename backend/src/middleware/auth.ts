import { Request, Response, NextFunction } from "express";
import { lucia } from "../lib/auth";

function extractSessionId(req: Request): string | null {
  const cookieSession = lucia.readSessionCookie(req.headers.cookie ?? "");
  if (cookieSession) return cookieSession;

  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined') {
      return bearerToken;
    }
  }
  return null;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = extractSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session) {
    res.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (session && session.fresh) {
    res.setHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
  }

  res.locals.user = user;
  res.locals.session = session;
  
  return next();
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = extractSessionId(req);
  if (!sessionId) {
    res.locals.user = null;
    return next();
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);
    if (session && user) {
      res.locals.user = user;
      res.locals.session = session;
    } else {
      res.locals.user = null;
    }
  } catch (err) {
    res.locals.user = null;
  }

  return next();
};

