import { VitePluginNode } from "vite-plugin-node";

export default ({ command }) => ({
  publicDir: false,
  build: {
    emptyOutDir: false,
    assetsDir: "",
    outDir: "./",
    rollupOptions: {
      output: {
        entryFileNames: `cli.js`,
      },
    },
  },
  plugins: [
    ...VitePluginNode({
      appPath: "./src/start.ts",
    }),
  ],
});
