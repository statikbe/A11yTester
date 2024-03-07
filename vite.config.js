import { viteStaticCopy } from "vite-plugin-static-copy";

export default ({ command }) => ({
  base: "",
  publicDir: false,
  build: {
    emptyOutDir: true,
    assetsDir: "",
    manifest: true,
    outDir: "./public/frontend/",
    rollupOptions: {
      input: {
        site: "./src/frontend/js/site.ts",
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "src/frontend/img/",
          dest: "",
        },
      ],
    }),
  ],
});
