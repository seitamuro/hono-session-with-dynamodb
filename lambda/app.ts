import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { SessionData, sessionMiddleware } from "./middleware";

type Variables = {
  session_id: string;
  session_data: SessionData;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", sessionMiddleware);

app.get("/", async (c) => {
  const sessionData = c.get("session_data");
  const count = Number(sessionData.get("count")?.N || "0");
  await sessionData.set("count", { N: `${count + 1}` });
  return c.text(`Hello, World! ${JSON.stringify(sessionData.data)}`);
});

export const handler = handle(app);
