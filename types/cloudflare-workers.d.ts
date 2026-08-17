declare module "cloudflare:workers" {
  export const env: {
    DB?: unknown;
    [key: string]: unknown;
  };
}
