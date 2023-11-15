export default ({ command }) => ({
  base: "/frontend/",
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
});
