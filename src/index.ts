import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import "dotenv/config";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import usersRouter from "./routes/user.js";
import classesRouter from "./routes/classes.js";

import subjectsRouter from "./routes/subjects.js";
import securityMiddleware from "./middleware/security.js";
import { auth } from "./lib/auth.js";


const app = express();
const PORT = 8000;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Classroom API",
      version: "1.0.0",
      description: "API para el sistema de gestión de aulas",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(
    cors({
      origin: process.env.FRONTEND_URL, // React app URL
      methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
      credentials: true, // allow cookies
    })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware);

app.use("/api/subjects", subjectsRouter);
app.use("/api/users", usersRouter);
app.use("/api/classes", classesRouter);
// app.use("/api/departments", departmentsRouter);
// app.use("/api/stats", statsRouter);
// app.use("/api/enrollments", enrollmentsRouter);

app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
