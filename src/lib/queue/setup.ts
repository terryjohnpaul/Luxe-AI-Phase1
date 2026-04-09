import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ============================================================
// QUEUES
// ============================================================

export const optimizationQueue = new Queue("optimization", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});

export const signalQueue = new Queue("signals", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 50,
    attempts: 2,
    backoff: { type: "fixed", delay: 3000 },
  },
});

export const creativeQueue = new Queue("creative", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
  },
});

export const syncQueue = new Queue("sync", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
  },
});

// ============================================================
// JOB TYPES
// ============================================================

export type OptimizationJobData = {
  type: "run_optimization_cycle";
  organizationId: string;
};

export type SignalJobData = {
  type: "check_weather" | "check_trends" | "check_social" | "check_inventory" | "process_signal";
  organizationId: string;
  signalData?: any;
};

export type CreativeJobData = {
  type: "generate_video" | "generate_variants" | "generate_ad_copy";
  organizationId: string;
  payload: any;
};

export type SyncJobData = {
  type: "sync_meta_campaigns" | "sync_meta_insights" | "sync_google_campaigns" | "sync_google_insights" | "sync_ga4";
  organizationId: string;
  adAccountId: string;
};

// ============================================================
// SCHEDULE RECURRING JOBS
// ============================================================

export async function setupRecurringJobs(organizationId: string) {
  // Optimization cycle every 4 hours
  await optimizationQueue.add(
    "optimization-cycle",
    { type: "run_optimization_cycle", organizationId },
    {
      repeat: { every: 4 * 60 * 60 * 1000 }, // 4 hours
      jobId: `opt-${organizationId}`,
    }
  );

  // Weather check every 2 hours
  await signalQueue.add(
    "weather-check",
    { type: "check_weather", organizationId },
    {
      repeat: { every: 2 * 60 * 60 * 1000 },
      jobId: `weather-${organizationId}`,
    }
  );

  // Trends check every 4 hours
  await signalQueue.add(
    "trends-check",
    { type: "check_trends", organizationId },
    {
      repeat: { every: 4 * 60 * 60 * 1000 },
      jobId: `trends-${organizationId}`,
    }
  );

  // Campaign sync every 30 minutes
  await syncQueue.add(
    "meta-sync",
    { type: "sync_meta_insights", organizationId, adAccountId: "" },
    {
      repeat: { every: 30 * 60 * 1000 },
      jobId: `meta-sync-${organizationId}`,
    }
  );

  await syncQueue.add(
    "google-sync",
    { type: "sync_google_insights", organizationId, adAccountId: "" },
    {
      repeat: { every: 30 * 60 * 1000 },
      jobId: `google-sync-${organizationId}`,
    }
  );
}

export { connection };
