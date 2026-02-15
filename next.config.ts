import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["jsdom", "@mozilla/readability", "turndown"],
};

export default config;
