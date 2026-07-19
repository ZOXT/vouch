import dotenv from "dotenv";
dotenv.config();
import express from "express";
import pool from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes"
import testimonialRequestRouter from "./routes/testimonial-request.routes";
import testimonialRouter from "./routes/testimonial.routes";
import "./config/env";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);



  pool.query("SELECT NOW()")
    .then(() => console.log("Database connected"))
    .catch((err) => console.error("Database connection failed:", err));
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/testimonial-requests", testimonialRequestRouter);
app.use("/api/v1/testimonials", testimonialRouter);
