/**
 * LUXE AI Background Worker
 *
 * Runs as a separate process alongside the Next.js server.
 * Handles: optimization cycles (4hr), signal checks (2hr), sync (30min), creative generation
 *
 * Start with: npx tsx src/worker.ts
 * Production: pm2 start npx --name "luxe-worker" -- tsx src/worker.ts
 */

import { Worker } from "bullmq";
import IORedis from "ioredis";
import {
  processOptimization,
  processSignal,
  processSync,
  processCreative,
  processLearning,
} from "./lib/queue/processor";
import type {
  OptimizationJobData,
  SignalJobData,
  SyncJobData,
  CreativeJobData,
  LearningJobData,
} from "./lib/queue/setup";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

console.log("===========================================");
console.log("  LUXE AI Worker Starting...");
console.log("  Time: " + new Date().toISOString());
console.log("===========================================");

// ============================================================
// OPTIMIZATION WORKER (4-hour cycle)
// ============================================================

const optimizationWorker = new Worker<OptimizationJobData>(
  "optimization",
  async (job) => {
    console.log(`[Worker] Processing optimization job: ${job.id}`);
    return processOptimization(job.data);
  },
  {
    connection,
    concurrency: 1, // Only 1 optimization cycle at a time
    limiter: { max: 1, duration: 60000 }, // Max 1 per minute (safety)
  }
);

optimizationWorker.on("completed", (job) => {
  console.log(`[Worker] Optimization job ${job.id} completed:`, job.returnvalue);
});

optimizationWorker.on("failed", (job, err) => {
  console.error(`[Worker] Optimization job ${job?.id} failed:`, err.message);
});

// ============================================================
// SIGNAL WORKER (weather, trends, inventory checks)
// ============================================================

const signalWorker = new Worker<SignalJobData>(
  "signals",
  async (job) => {
    console.log(`[Worker] Processing signal job: ${job.name} (${job.data.type})`);
    return processSignal(job.data);
  },
  {
    connection,
    concurrency: 3, // Can process multiple signal types in parallel
  }
);

signalWorker.on("completed", (job) => {
  console.log(`[Worker] Signal job ${job.name} completed`);
});

signalWorker.on("failed", (job, err) => {
  console.error(`[Worker] Signal job ${job?.name} failed:`, err.message);
});

// ============================================================
// SYNC WORKER (Meta/Google data sync)
// ============================================================

const syncWorker = new Worker<SyncJobData>(
  "sync",
  async (job) => {
    console.log(`[Worker] Processing sync job: ${job.name} (${job.data.type})`);
    return processSync(job.data);
  },
  {
    connection,
    concurrency: 2, // Meta and Google can sync in parallel
  }
);

syncWorker.on("completed", (job) => {
  console.log(`[Worker] Sync job ${job.name} completed`);
});

syncWorker.on("failed", (job, err) => {
  console.error(`[Worker] Sync job ${job?.name} failed:`, err.message);
});

// ============================================================
// CREATIVE WORKER (video generation, ad copy)
// ============================================================

const creativeWorker = new Worker<CreativeJobData>(
  "creative",
  async (job) => {
    console.log(`[Worker] Processing creative job: ${job.name} (${job.data.type})`);
    return processCreative(job.data);
  },
  {
    connection,
    concurrency: 2,
  }
);

creativeWorker.on("completed", (job) => {
  console.log(`[Worker] Creative job ${job.name} completed`);
});

creativeWorker.on("failed", (job, err) => {
  console.error(`[Worker] Creative job ${job?.name} failed:`, err.message);
});


// ============================================================
// LEARNING WORKER (flywheel — predictions, drift, benchmarks)
// ============================================================

const learningWorker = new Worker<LearningJobData>(
  "learning",
  async (job) => {
    console.log(`[Worker] Processing learning job: ${job.name} (${job.data.type})`);
    return processLearning(job.data);
  },
  {
    connection,
    concurrency: 1,
  }
);

learningWorker.on("completed", (job) => {
  console.log(`[Worker] Learning job ${job.name} completed`);
});

learningWorker.on("failed", (job, err) => {
  console.error(`[Worker] Learning job ${job?.name} failed:`, err.message);
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function shutdown() {
  console.log("\n[Worker] Shutting down gracefully...");
  await optimizationWorker.close();
  await signalWorker.close();
  await syncWorker.close();
  await creativeWorker.close();
  await learningWorker.close();
  await connection.quit();
  console.log("[Worker] Shutdown complete.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("[Worker] All workers started. Waiting for jobs...");
console.log("[Worker] Queues: optimization, signals, sync, creative, learning");


// ============================================================
// STARTUP: Schedule recurring jobs
// ============================================================
(async () => {
  try {
    const { setupRecurringJobs, setupLearningJobs } = await import("./lib/queue/setup");
    
    // Setup jobs for Ajio Luxe org
    await setupRecurringJobs("org_ajio_luxe");
    console.log("[Worker] Recurring jobs scheduled for org_ajio_luxe");
    
    await setupLearningJobs();
    console.log("[Worker] Learning jobs scheduled (daily predictions, weekly drift)");
  } catch (e) {
    console.error("[Worker] Failed to setup recurring jobs:", e);
  }
})();
