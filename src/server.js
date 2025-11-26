import express from "express";
import authRouter from "./routes/auth.route.js";
import testRouter from "./routes/test.route.js";
import postRouter from "./routes/post.route.js";
import partyRouter from "./routes/party.route.js";
import commentRouter from "./routes/comment.route.js";
import userRouter from "./routes/user.route.js";

const app = express();
app.use(express.json());

// Auth
app.use("/", authRouter);
app.use("/", testRouter);
app.use("/", postRouter);
app.use("/", partyRouter);
app.use("/", commentRouter);
app.use("/", userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
