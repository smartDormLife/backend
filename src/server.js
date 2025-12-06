import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import router from "./routes/index.js";
import { socketAuthMiddleware } from "./middlewares/socketAuth.js";
import { setupChatHandlers } from "./socket/chatHandler.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.use(socketAuthMiddleware);

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/auth", router.auth);
app.use("/users", router.users);
app.use("/posts", router.posts);
app.use("/comments", router.comments);
app.use("/parties", router.parties);
app.use("/dormitories", router.dorm);
app.use("/chat", router.chat);

app.get("/", (req, res) => res.send("Server OK"));

setupChatHandlers(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io server ready`);
});

export { io };

