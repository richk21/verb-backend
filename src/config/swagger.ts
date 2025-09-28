import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Verb API",
      version: "1.0.0",
      description: "API documentation for Verb",
    },
    servers: [
      {
        url: `http://localhost:5000`,
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
