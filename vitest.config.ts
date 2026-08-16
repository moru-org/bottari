import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    fileParallelism: false, // SQLite DB 공유 시 race condition 방지
    environment: "node",
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
