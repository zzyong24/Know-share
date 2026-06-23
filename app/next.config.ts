import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 钉住 Turbopack 工作区根为本 app 目录，避免 Next 因上层无关的
  // package-lock.json 把根推断到 /Users/zyongzhu/Workbase 导致文件追踪错误。
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
