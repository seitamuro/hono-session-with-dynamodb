import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { sessionMiddleware } from "./middleware";

const app = new Hono();

app.use("*", sessionMiddleware);

app.get("/", async (c) => {
  return c.text("Hello, World!");
});

export const handler = handle(app);
