import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { sessionMiddleware } from "./middleware";

const app = new Hono();

app.use("*", sessionMiddleware);

app.get("/", sessionMiddleware, async (c) => {
  const sessionData = c.var.session_data;
  const count = Number(sessionData.get("count")?.N || "0");
  await sessionData.set("count", { N: `${count + 1}` });
  return c.text(`Hello, World! ${JSON.stringify(sessionData.data)}`);
});

export const handler = handle(app);
