import type { Config } from "@netlify/functions";

export default async () => {
  return new Response(JSON.stringify({ message: "Hello from Netlify Functions" }), {
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/hello",
};
