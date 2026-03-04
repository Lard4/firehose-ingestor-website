import { WebSocketServer, WebSocket } from "ws";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { EventSource } from "eventsource";

const PORT = 3001;

interface Post {
  handle: string;
  content: string;
  likes: number;
  quotes: number;
  replies: number;
  reposts: number;
  imageUrls?: string[];
  parent?: Post;
}

type StreamClient = {
  ws: WebSocket;
};

const clients = new Set<StreamClient>();

function isWellFormedPost(data: unknown): data is Post {
  if (typeof data !== "object" || data === null) return false;
  const post = data as Post;
  return (
    typeof post.handle === "string" &&
    typeof post.content === "string" &&
    typeof post.likes === "number" &&
    typeof post.quotes === "number" &&
    typeof post.replies === "number" &&
    typeof post.reposts === "number"
    // skip imageurls since they may be null
  );
}

function connectUpstream() {
  const upstream = new EventSource("https://verda-nonobsessional-jaxon.ngrok-free.dev/feed");
  upstream.onmessage = (event) => {
    const raw: unknown = JSON.parse(event.data.toString());
    if (!isWellFormedPost(raw)) {
      console.warn("Received malformed post:", raw);
      return;
    }

    for (const client of clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(raw));
      }
    }
  };
}

function stopStreaming(client: StreamClient) {
  clients.delete(client);
}

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", connectedClients: clients.size }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const wss = new WebSocketServer({ server: httpServer, path: "/stream" });

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  const client: StreamClient = { ws };
  clients.add(client);

  ws.on("close", () => {
    stopStreaming(client);
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    stopStreaming(client);
  });
});

connectUpstream();

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket stream: ws://localhost:${PORT}/stream`);
});