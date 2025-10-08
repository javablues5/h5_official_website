import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  // 读取 .env 文件
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [vue()],
    server: {
      proxy:
        mode === "development"
          ? {
              "/api": {
                // target: 'https://www.htg72n.com/',
                target: "https://www.htg72n.com/",
                changeOrigin: true,
                // 注意：如果后端接口路径已经带 /api，不要写 rewrite
                rewrite: (path) => path.replace(/^\/api/, ""),
              },
              "/apc": {
                // target: 'https://www.htg72n.com/',
                target: "https://www.1234kj.tv",
                changeOrigin: true,
                // 注意：如果后端接口路径已经带 /api，不要写 rewrite
                rewrite: (path) => path.replace(/^\/apc/, ""),
              },
              // '/official_website': {
              //   // target: 'https://www.htg72n.com', // 你的后端域名
              //   target:'http://172.16.1.248:8081',
              //   changeOrigin: true,
              // },
            }
          : undefined,
    },
  };
});
