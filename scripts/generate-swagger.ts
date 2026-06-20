import swaggerJsDoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";

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
        url: "http://localhost:8000",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const outputPath = path.join(process.cwd(), "swagger.json");
fs.writeFileSync(outputPath, JSON.stringify(swaggerDocs, null, 2));

console.log(`Swagger file generated at: ${outputPath}`);
