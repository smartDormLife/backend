import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";


const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/", userRoutes); 
app.use("/user", userRoutes); 
app.use("/users", userRoutes);



app.use(errorHandler);

export default app;
