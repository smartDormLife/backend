import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
import authRouter from "./routes/auth.route.js";
import dormRouter from "./routes/dorm.route.js";
// import testRouter from "./routes/test.route.js";
import postRouter from "./routes/post.route.js";
import partyRouter from "./routes/party.route.js";
import commentRouter from "./routes/comment.route.js";
import userRouter from "./routes/user.route.js";

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "";
app.use(cors({
  origin: FRONTEND_URL, // 프론트엔드 주소
  credentials: true, // 쿠키/인증 헤더 허용
}));
app.use(express.json());

// Auth
app.use("/auth", authRouter);
// app.use("/", testRouter);
app.use("/", dormRouter);
app.use("/", postRouter);
app.use("/", partyRouter);
app.use("/", commentRouter);
app.use("/users", userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
