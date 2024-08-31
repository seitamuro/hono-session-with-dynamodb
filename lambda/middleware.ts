import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

type Variables = {
  session_id: string;
  session_data: SessionData;
};

const SESSION_EXPIRE = 60 * 60 * 24;
const SESSION_TABLE_NAME = process.env.SESSION_TABLE_NAME;
if (!SESSION_TABLE_NAME) {
  throw new Error("SESSION_TABLE_NAME is not set");
}

export class SessionData {
  id: string;
  data: Record<string, AttributeValue>;

  constructor(id: string) {
    this.id = id;

    const getCommand = new GetItemCommand({
      TableName: SESSION_TABLE_NAME,
      Key: {
        id: { S: id },
      },
    });
    this.data = {} as Record<string, AttributeValue>;
  }

  async preload() {
    const getCommand = new GetItemCommand({
      TableName: SESSION_TABLE_NAME,
      Key: {
        id: { S: this.id },
      },
    });
    const response = await client.send(getCommand);
    if (!response.Item) {
      this.data = { id: { S: this.id } };
      const putCommand = new PutItemCommand({
        TableName: SESSION_TABLE_NAME,
        Item: this.data,
      });
      await client.send(putCommand);
    } else {
      this.data = response.Item;
    }
  }

  async set(key: string, value: AttributeValue) {
    this.data[key] = value;

    const setCommand = new PutItemCommand({
      TableName: SESSION_TABLE_NAME,
      Item: this.data,
    });
    await client.send(setCommand);
  }

  get(key: string): AttributeValue | undefined {
    return this.data[key];
  }
}

const client = new DynamoDBClient({});

const generateAndSetSessionId = (c: Context) => {
  const sessionId = crypto.randomUUID();
  setCookie(c, "session_id", sessionId, {
    httpOnly: true,
    maxAge: SESSION_EXPIRE,
  });
  return sessionId;
};

export const sessionMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c: Context, next: Next) => {
    const sessionId = getCookie(c, "session_id") || generateAndSetSessionId(c);
    const session_data = new SessionData(sessionId);
    await session_data.preload();
    c.set("session_id", sessionId);
    c.set("session_data", session_data);
    await next();
  }
);
