const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RentEase API",
      version: "1.0.0",
      description: "Dokumentasi API RentEase",
    },
    servers: [
      {
        url: "https://rentase-api.vercel.app",
      },
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;