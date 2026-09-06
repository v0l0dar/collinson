import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    dedupe: ["graphql"],
  },
  test: {
    exclude: ["dist/**", "node_modules/**"],
  },
});
