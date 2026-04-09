/**
 * AI Video Generation Integration
 *
 * Supports: Kling v2 (primary, cheaper), Runway Gen-4 (premium)
 * Purpose: Convert static brand sandbox images to 3-15 second video ads
 */

import jwt from "jsonwebtoken";

// ============================================================
// KLING AI v2 (Primary — INR 24/video)
// ============================================================

interface KlingConfig {
  accessKey: string;
  secretKey: string;
}

interface VideoGenerationResult {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  provider: "kling" | "runway";
}

export class KlingClient {
  private accessKey: string;
  private secretKey: string;

  constructor(config: KlingConfig) {
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
  }

  private generateToken(): string {
    const payload = {
      iss: this.accessKey,
      exp: Math.floor(Date.now() / 1000) + 1800, // 30 min
      nbf: Math.floor(Date.now() / 1000) - 5,
    };
    return jwt.sign(payload, this.secretKey, { algorithm: "HS256" });
  }

  async imageToVideo(params: {
    imageUrl: string;
    prompt: string;
    duration?: "5" | "10";
    aspectRatio?: "16:9" | "9:16" | "1:1";
    mode?: "high_quality" | "high_performance";
  }): Promise<VideoGenerationResult> {
    const token = this.generateToken();

    const resp = await fetch("https://api.klingai.com/v1/videos/image2video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name: "kling-v2",
        image: params.imageUrl,
        prompt: params.prompt,
        duration: params.duration || "5",
        aspect_ratio: params.aspectRatio || "9:16",
        mode: params.mode || "high_quality",
      }),
    });

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(`Kling API error: ${JSON.stringify(error)}`);
    }

    const data = await resp.json();

    return {
      taskId: data.data?.task_id || data.task_id,
      status: "pending",
      provider: "kling",
    };
  }

  async checkStatus(taskId: string): Promise<VideoGenerationResult> {
    const token = this.generateToken();

    const resp = await fetch(`https://api.klingai.com/v1/videos/image2video/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json();
    const task = data.data;

    return {
      taskId,
      status: task?.task_status === "succeed" ? "completed" :
              task?.task_status === "failed" ? "failed" : "processing",
      videoUrl: task?.task_result?.videos?.[0]?.url,
      thumbnailUrl: task?.task_result?.videos?.[0]?.cover_url,
      duration: task?.task_result?.videos?.[0]?.duration,
      provider: "kling",
    };
  }
}

// ============================================================
// RUNWAY Gen-4 (Premium — INR 85/video)
// ============================================================

export class RunwayClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async imageToVideo(params: {
    imageUrl: string;
    prompt: string;
    duration?: 5 | 10;
    ratio?: "16:9" | "9:16" | "1:1";
  }): Promise<VideoGenerationResult> {
    const resp = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen4_turbo",
        promptImage: params.imageUrl,
        promptText: params.prompt,
        duration: params.duration || 5,
        ratio: params.ratio || "9:16",
        watermark: false,
      }),
    });

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(`Runway API error: ${JSON.stringify(error)}`);
    }

    const data = await resp.json();

    return {
      taskId: data.id,
      status: "pending",
      provider: "runway",
    };
  }

  async checkStatus(taskId: string): Promise<VideoGenerationResult> {
    const resp = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    });

    const data = await resp.json();

    return {
      taskId,
      status: data.status === "SUCCEEDED" ? "completed" :
              data.status === "FAILED" ? "failed" : "processing",
      videoUrl: data.output?.[0],
      provider: "runway",
    };
  }
}

// ============================================================
// VIDEO PROMPT TEMPLATES (for luxury fashion)
// ============================================================

export const VIDEO_PROMPTS = {
  productRotation: (brand: string) =>
    `A luxury ${brand} product slowly rotating on a clean surface with soft, dramatic lighting. Cinematic quality, premium aesthetic.`,

  lifestyleContext: (brand: string, setting: string) =>
    `A stylish person wearing ${brand} in a ${setting}. Elegant movement, natural lighting, aspirational mood. Premium fashion film quality.`,

  zoomToDetail: (brand: string, detail: string) =>
    `Slow cinematic zoom into the ${detail} of a ${brand} product. Reveals craftsmanship and texture. Soft focus background, luxury lighting.`,

  unboxing: (brand: string) =>
    `Hands carefully opening a ${brand} luxury box, revealing the product inside. Clean, minimal setting. ASMR-quality close-up. Premium unboxing experience.`,

  modelWalking: (brand: string, style: string) =>
    `A confident model walking in ${brand} ${style}. Urban luxury setting. Smooth camera movement. Fashion film quality with cinematic color grading.`,
};

export type { VideoGenerationResult };
