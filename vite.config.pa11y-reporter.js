import { VitePluginNode } from "vite-plugin-node";

export default ({ command }) => ({
  publicDir: false,
  build: {
    emptyOutDir: false,
    assetsDir: "",
    outDir: "./src",
    // rollupOptions: {
    //   output: {
    //     entryFileNames: `cli.js`,
    //   },
    // },
  },
  plugins: [
    ...VitePluginNode({
      appPath: "./src/pa11y-reporter.ts",
    }),
  ],
});
