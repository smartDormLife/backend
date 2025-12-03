import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";

dotenv.config();



const app = express();
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

app.get("/", (req, res) => res.send("Server OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
