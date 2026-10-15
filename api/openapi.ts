export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Fix Hub local demonstration API",
    version: "0.1.0",
    description:
      "Local demonstration endpoints only. This is not the approved production API and does not create bookings, send messages, or process payments.",
  },
  servers: [{ url: "http://127.0.0.1:4000", description: "Local development API" }],
  paths: {
    "/health/live": {
      get: {
        summary: "Process liveness",
        responses: { "200": { description: "The API process is responding." } },
      },
    },
    "/health/ready": {
      get: {
        summary: "Demo-service readiness",
        description:
          "Production mode deliberately remains not ready until authentication and persistent storage are implemented.",
        responses: {
          "200": { description: "Ready for local demonstration requests." },
          "503": { description: "Production dependencies are not configured." },
        },
      },
    },
    "/api/v1/demo/prices/{category}": {
      get: {
        summary: "Read a fictional baseline price example",
        description:
          "Returns only a sample estimate from the fictional demo fixture. It is not an offer, quote, tax determination, or merchant commitment.",
        parameters: [
          {
            name: "category",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["electrician", "plumbing", "ac", "appliance"] },
          },
        ],
        responses: {
          "200": {
            description: "Fictional, non-binding estimate example.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DemoPrice" } } },
          },
          "400": { description: "Invalid route input." },
          "429": { description: "Demo API rate limit reached." },
        },
      },
    },
  },
  components: {
    schemas: {
      DemoPrice: {
        type: "object",
        required: ["demoOnly", "currency", "category", "items", "total", "collectionMethod"],
        properties: {
          demoOnly: { const: true },
          currency: { const: "INR" },
          category: { type: "string" },
          items: { type: "array", items: { type: "object" } },
          total: { type: "number", minimum: 0 },
          collectionMethod: { const: "cash_on_service_completion_in_demo_only" },
        },
      },
      ApiError: {
        type: "object",
        required: ["error", "requestId"],
        properties: {
          error: { type: "object", required: ["code", "message"] },
          requestId: { type: "string", format: "uuid" },
        },
      },
    },
  },
} as const;
