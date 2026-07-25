import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "lib/__mocks__/server-only.ts"),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
