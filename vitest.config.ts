import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/lib": path.resolve(__dirname, "lib"),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
  },
});
