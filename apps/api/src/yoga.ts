import { createYoga } from "graphql-yoga";
import { schema } from "./schema.js";

// Shared between the local Node server (src/index.ts) and the Cloudflare
// Worker entry (src/worker.ts) — same handler, two ways to run it.
export const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  cors: {
    origin: "*",
    methods: ["POST", "OPTIONS"],
  },
});
