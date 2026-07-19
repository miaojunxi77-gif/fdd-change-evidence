import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserSite = repositoryName.endsWith(".github.io");
const githubBasePath = githubPages && repositoryName && !isUserSite ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  ...(githubPages
    ? {
        output: "export",
        trailingSlash: true,
        basePath: githubBasePath,
        assetPrefix: githubBasePath,
        images: { unoptimized: true },
        env: { NEXT_PUBLIC_BASE_PATH: githubBasePath },
      }
    : {}),
};

export default nextConfig;
