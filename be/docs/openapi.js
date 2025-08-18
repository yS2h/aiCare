const {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} = require("@asteasolutions/zod-to-openapi");
const { z } = require("zod");

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

function getOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions, "3.0.0");
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "aiCare API",
      version: "1.0.0",
      description: "aiCare 백엔드 API 문서",
      contact: { name: "aiCare", email: "support@aicare.local" },
    },

    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  });
}

module.exports = { registry, getOpenApiDocument };
