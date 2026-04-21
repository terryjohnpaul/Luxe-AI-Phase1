module.exports = {
  apps: [
    {
      name: "luxe-ai",
      script: "npm",
      args: "start",
      env: {
        PORT: 3200,
        NODE_ENV: "production",
      },
    },
    {
      name: "luxe-worker",
      script: "npx",
      args: "tsx src/worker.ts",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
