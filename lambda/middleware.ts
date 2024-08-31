import { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const SESSION_EXPIRE = 60 * 60 * 24;

const generateAndSetSessionId = (c: Context) => {
  const sessionId = crypto.randomUUID();
  setCookie(c, "session_id", sessionId, {
    httpOnly: true,
    maxAge: SESSION_EXPIRE,
  });
  return sessionId;
};

export const sessionMiddleware = async (c: Context, next: Next) => {
  const sessionId = getCookie(c, "session_id") || generateAndSetSessionId(c);
  c.set("session_id", sessionId);
  await next();
};
