import express from 'express';
import subjectsRouter from "./routes/subjects";
import cors from "cors";
import securityMiddleware from "./middleware/security";
import {toNodeHandler} from "better-auth/node";
import {auth} from "./lib/auth";

const app = express();
const port = 8000;

app.use(express.json());

if(!process.env.FRONTEND_URL) throw new Error ('FRONTEND_URL is not set in .env file');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))
app.use('/api/subjects', subjectsRouter)

app.use (securityMiddleware);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Classroom Backend!' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
