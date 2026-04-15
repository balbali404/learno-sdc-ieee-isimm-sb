"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Camera,
  Eye,
  ShieldCheck,
  Wifi,
  WifiOff,
  AlertTriangle,
  Smartphone,
  Move,
  Brain,
  Volume2,
  VolumeX,
} from "lucide-react";

interface AttentionTrackerProps {
  onClose: () => void;
  onSessionSummary?: (summary: {
    averageEngagement: number;
    focusedTimeSec: number;
    totalTimeSec: number;
    alertsCount: number;
    distractedByPhoneCount: number;
  }) => void;
  autoOpenPip?: boolean;
}

type AlertType = "away" | "tab" | "idle" | "motion" | "phone";

interface AttentionAlert {
  id: string;
  type: AlertType;
  message: string;
  time: Date;
}

interface FaceLandmarkerResult {
  faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
}

interface PoseLandmarkerResult {
  landmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>>;
}

interface DetectionCategory {
  categoryName: string;
  score: number;
}

interface DetectionBoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface Detection {
  categories: DetectionCategory[];
  boundingBox?: DetectionBoundingBox;
}

interface ObjectDetectorResult {
  detections?: Detection[];
}

interface VisionTasksModule {
  FilesetResolver: {
    forVisionTasks(path: string): Promise<unknown>;
  };
  FaceLandmarker: {
    createFromOptions(
      resolver: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate?: "GPU" | "CPU" };
        runningMode: "VIDEO";
        numFaces: number;
      },
    ): Promise<{
      detectForVideo(video: HTMLVideoElement, timestamp: number): FaceLandmarkerResult;
      close?: () => void;
    }>;
  };
  PoseLandmarker: {
    createFromOptions(
      resolver: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate?: "GPU" | "CPU" };
        runningMode: "VIDEO";
        numPoses: number;
      },
    ): Promise<{
      detectForVideo(video: HTMLVideoElement, timestamp: number): PoseLandmarkerResult;
      close?: () => void;
    }>;
  };
  ObjectDetector: {
    createFromOptions(
      resolver: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate?: "GPU" | "CPU" };
        runningMode: "VIDEO";
        scoreThreshold: number;
      },
    ): Promise<{
      detectForVideo(video: HTMLVideoElement, timestamp: number): ObjectDetectorResult;
      close?: () => void;
    }>;
  };
}

interface RuntimeModels {
  faceLandmarker: {
    detectForVideo(video: HTMLVideoElement, timestamp: number): FaceLandmarkerResult;
    close?: () => void;
  };
  poseLandmarker: {
    detectForVideo(video: HTMLVideoElement, timestamp: number): PoseLandmarkerResult;
    close?: () => void;
  };
  objectDetector: {
    detectForVideo(video: HTMLVideoElement, timestamp: number): ObjectDetectorResult;
    close?: () => void;
  };
}

type ComputeDelegate = "GPU" | "CPU";

const alertMessages: Record<
  AlertType,
  { icon: string; text: string; desc: string; tone: "info" | "warning" | "error" }
> = {
  away: {
    icon: "👀",
    text: "Face not detected",
    desc: "Please stay in front of your screen.",
    tone: "warning",
  },
  tab: {
    icon: "📱",
    text: "Tab switched",
    desc: "Return to your lesson to keep focus score high.",
    tone: "error",
  },
  idle: {
    icon: "🖱️",
    text: "Idle detected",
    desc: "Move your mouse or continue reading.",
    tone: "warning",
  },
  motion: {
    icon: "🤸",
    text: "Too much movement",
    desc: "Try to stay steady to improve concentration.",
    tone: "info",
  },
  phone: {
    icon: "📵",
    text: "Phone detected",
    desc: "Put phone away during focus mode.",
    tone: "error",
  },
};

const MEDIAPIPE_IMPORT_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs";
const MEDIAPIPE_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";

const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const OBJECT_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

const importFromUrl = async <T,>(url: string): Promise<T> => {
  // NOTE: Turbopack rewrites plain import(url) and can break remote module imports.
  // Using runtime Function keeps native browser import semantics for external URLs.
  const runtimeImport = new Function("u", "return import(u)") as (u: string) => Promise<T>;
  return runtimeImport(url);
};

const logModel = (message: string, extra?: unknown) => {
  if (extra !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[AttentionTracker] ${message}`, extra);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[AttentionTracker] ${message}`);
};

let sharedModels: RuntimeModels | null = null;
let sharedModelsPromise: Promise<RuntimeModels> | null = null;
let sharedModelsDelegate: ComputeDelegate | null = null;

const getPreferredDelegate = (): ComputeDelegate => {
  // Prefer GPU whenever available; MediaPipe may still internally use CPU/XNNPACK.
  // We keep this explicit for best chance at acceleration on supported devices.
  return "GPU";
};

const createRuntimeModels = async (delegate: ComputeDelegate): Promise<RuntimeModels> => {
  const start = performance.now();
  logModel(`Starting MediaPipe runtime import (delegate=${delegate})`);
  const vision = await importFromUrl<VisionTasksModule>(MEDIAPIPE_IMPORT_URL);
  logModel("MediaPipe runtime imported");

  logModel("Initializing FilesetResolver", MEDIAPIPE_WASM_PATH);
  const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
  logModel("FilesetResolver ready");

  const faceStart = performance.now();
  logModel("Loading face model", FACE_MODEL_URL);

  const facePromise = vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: FACE_MODEL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });

  const poseStart = performance.now();
  logModel("Loading pose model", POSE_MODEL_URL);
  const posePromise = vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: POSE_MODEL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });

  const objectStart = performance.now();
  logModel("Loading object detector model", OBJECT_MODEL_URL);
  const objectPromise = vision.ObjectDetector.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: OBJECT_MODEL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    scoreThreshold: 0.5,
  });

  const [faceLandmarker, poseLandmarker, objectDetector] = await Promise.all([
    facePromise,
    posePromise,
    objectPromise,
  ]);

  logModel(`Face model ready in ${Math.round(performance.now() - faceStart)}ms`);
  logModel(`Pose model ready in ${Math.round(performance.now() - poseStart)}ms`);
  logModel(`Object model ready in ${Math.round(performance.now() - objectStart)}ms`);
  logModel(`All models ready in ${Math.round(performance.now() - start)}ms`);

  return {
    faceLandmarker,
    poseLandmarker,
    objectDetector,
  };
};

const getOrLoadSharedModels = async (): Promise<{ models: RuntimeModels; delegate: ComputeDelegate }> => {
  const preferredDelegate = getPreferredDelegate();

  if (sharedModels && sharedModelsDelegate !== preferredDelegate) {
    logModel(
      `Delegate preference changed (${sharedModelsDelegate} -> ${preferredDelegate}); dropping old cache`,
    );
    sharedModels = null;
    sharedModelsDelegate = null;
    sharedModelsPromise = null;
  }

  if (sharedModels) {
    logModel(`Using cached shared models (delegate=${sharedModelsDelegate})`);
    return { models: sharedModels, delegate: sharedModelsDelegate ?? preferredDelegate };
  }

  if (!sharedModelsPromise) {
    logModel(`No cached models, creating shared models (delegate=${preferredDelegate})`);
    sharedModelsPromise = createRuntimeModels(preferredDelegate)
      .then((models) => {
        sharedModels = models;
        sharedModelsDelegate = preferredDelegate;
        logModel(`Shared models cached successfully (delegate=${preferredDelegate})`);
        return models;
      })
      .catch((error) => {
        logModel("Shared model loading failed", error);
        throw error;
      })
      .finally(() => {
        logModel("Shared model loading promise settled");
        sharedModelsPromise = null;
      });
  } else {
    logModel("Awaiting existing shared model loading promise");
  }

  const models = await sharedModelsPromise;
  return {
    models,
    delegate: sharedModelsDelegate ?? preferredDelegate,
  };
};

export async function preloadAttentionModels(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    logModel("Preload request started");
    const result = await getOrLoadSharedModels();
    logModel(`Preload request completed (delegate=${result.delegate})`);
  } catch (error) {
    logModel("Preload request failed", error);
    // best-effort preload; tracker will retry on demand
  }
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const safePoint = (point?: { x: number; y: number }) =>
  point && Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;

const calcEAR = (
  landmarks: Array<{ x: number; y: number }>,
  eyeIndices: [number, number, number, number, number, number],
) => {
  const p1 = safePoint(landmarks[eyeIndices[0]]);
  const p2 = safePoint(landmarks[eyeIndices[1]]);
  const p3 = safePoint(landmarks[eyeIndices[2]]);
  const p4 = safePoint(landmarks[eyeIndices[3]]);
  const p5 = safePoint(landmarks[eyeIndices[4]]);
  const p6 = safePoint(landmarks[eyeIndices[5]]);

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) {
    return null;
  }

  const vertical = dist(p2, p6) + dist(p3, p5);
  const horizontal = Math.max(0.0001, dist(p1, p4));
  return vertical / (2 * horizontal);
};

export function AttentionTracker({ onClose, onSessionSummary, autoOpenPip = false }: AttentionTrackerProps) {
  const [phase, setPhase] = useState<"setup" | "active">("setup");
  const [cameraGranted, setCameraGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);

  const [engagementScore, setEngagementScore] = useState(100);
  const [isPresent, setIsPresent] = useState(true);
  const [isUsingPhone, setIsUsingPhone] = useState(false);
  const [alerts, setAlerts] = useState<AttentionAlert[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [focusedTime, setFocusedTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [pipUnavailable, setPipUnavailable] = useState(false);
  const [activeDelegate, setActiveDelegate] = useState<ComputeDelegate | null>(null);
  const [analysisIntervalMs, setAnalysisIntervalMs] = useState(300);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pipRequestedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraGrantedRef = useRef(false);

  const modelsRef = useRef<RuntimeModels | null>(null);
  const analyzingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const lastMouseMove = useRef<number>(Date.now());
  const lastAlertByType = useRef<Record<AlertType, number>>({
    away: 0,
    tab: 0,
    idle: 0,
    motion: 0,
    phone: 0,
  });

  const scoreBuffer = useRef<number[]>([100, 100, 100, 100, 100]);
  const phoneAlertCount = useRef(0);
  const engagementHistory = useRef<number[]>([]);
  const lastWaitLogRef = useRef(0);
  const lastNoFrameLogRef = useRef(0);
  const lastAnalyzeAtRef = useRef(0);
  const previousNoseRef = useRef<{ x: number; y: number } | null>(null);
  const movementScoreRef = useRef(0);
  const leftEyeClosedFramesRef = useRef(0);
  const rightEyeClosedFramesRef = useRef(0);

  useEffect(() => {
    cameraGrantedRef.current = cameraGranted;
  }, [cameraGranted]);

  const beep = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
      void ctx.close();
    } catch {
      // best effort sound alert
    }
  }, [soundEnabled]);

  const addAlert = useCallback(
    (type: AlertType) => {
      const now = Date.now();
      const cooldowns: Record<AlertType, number> = {
        away: 14000,
        tab: 8000,
        idle: 30000,
        motion: 20000,
        phone: 10000,
      };

      if (now - lastAlertByType.current[type] < cooldowns[type]) {
        return;
      }
      lastAlertByType.current[type] = now;

      const entry = alertMessages[type];

      const alert: AttentionAlert = {
        id: `${type}-${now}`,
        type,
        message: entry.text,
        time: new Date(),
      };

      setAlerts((prev) => [alert, ...prev].slice(0, 8));

      if (type === "phone") {
        phoneAlertCount.current += 1;
      }

      if (entry.tone === "error") {
        toast.error(`${entry.icon} ${entry.text}`, {
          description: entry.desc,
          duration: 4000,
        });
      } else if (entry.tone === "warning") {
        toast.warning(`${entry.icon} ${entry.text}`, {
          description: entry.desc,
          duration: 3500,
        });
      } else {
        toast.info(`${entry.icon} ${entry.text}`, {
          description: entry.desc,
          duration: 3000,
        });
      }

      beep();
    },
    [beep],
  );

  const closeModels = useCallback(() => {
    modelsRef.current = null;
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setVideoReady(false);
    lastAnalyzeAtRef.current = 0;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    closeModels();
  }, [closeModels]);

  const loadModels = useCallback(async () => {
    logModel("loadModels called", {
      hasLocalRef: Boolean(modelsRef.current),
      hasSharedCache: Boolean(sharedModels),
    });

    if (modelsRef.current || sharedModels) {
      if (!modelsRef.current && sharedModels) {
        modelsRef.current = sharedModels;
        logModel("Attached shared models to local component reference");
      }
      setActiveDelegate(sharedModelsDelegate);
      setModelsReady(true);
      logModel("Models already ready, skipping new load");
      return;
    }

    setIsModelLoading(true);
    try {
      logModel("Begin async model loading");
      const result = await getOrLoadSharedModels();
      modelsRef.current = result.models;
      setActiveDelegate(result.delegate);
      setModelsReady(true);
      logModel(`Model loading finished and local ref assigned (delegate=${result.delegate})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load MediaPipe models";
      logModel("Model loading threw error", err);
      if (cameraGrantedRef.current) {
        setCameraError(`Model loading issue: ${message}`);
      } else {
        setCameraError(null);
      }
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  const startCamera = async () => {
    logModel("startCamera clicked", {
      modelsReady,
      isModelLoading,
      hasLocalModels: Boolean(modelsRef.current),
      hasSharedModels: Boolean(sharedModels),
    });

    setCameraError(null);
    setVideoReady(false);
    previousNoseRef.current = null;
    movementScoreRef.current = 0;
    leftEyeClosedFramesRef.current = 0;
    rightEyeClosedFramesRef.current = 0;

    if (!modelsRef.current && !isModelLoading) {
      void loadModels();
      logModel("Triggered background model loading from startCamera");
    }

    try {
      logModel("Requesting user camera stream");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      logModel("Camera stream opened successfully (awaiting video mount/attach)");

      setCameraGranted(true);
      setPhase("active");

      if (!modelsRef.current) {
        void loadModels();
        logModel("Camera active before models ready; background loading continues");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not access camera";
      logModel("Camera start failed", err);
      setCameraError(
        message.toLowerCase().includes("permission")
          ? "Camera permission denied. Please allow camera access and try again."
          : message,
      );
    }
  };

  useEffect(() => {
    logModel("AttentionTracker mounted; preloading models");
    void loadModels();
  }, [loadModels]);

  useEffect(() => {
    logModel(`modelsReady state changed: ${modelsReady}`);
  }, [modelsReady]);

  useEffect(() => {
    if (!cameraGranted) return;
    if (modelsReady || isModelLoading) return;

    const retry = setTimeout(() => {
      void loadModels();
    }, 1200);

    return () => clearTimeout(retry);
  }, [cameraGranted, isModelLoading, loadModels, modelsReady]);

  useEffect(() => {
    if (!cameraGranted) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }

    const markReady = () => {
      if (!videoReady) {
        setVideoReady(true);
        logModel("Video element is ready for rendering frames", {
          width: video.videoWidth,
          height: video.videoHeight,
          readyState: video.readyState,
        });
      }
    };

    const onLoadedMetadata = async () => {
      try {
        if (video.paused) {
          await video.play();
        }
      } catch (error) {
        logModel("video.play() failed after loadedmetadata", error);
      }
      markReady();

      if (
        autoOpenPip &&
        !pipRequestedRef.current &&
        "pictureInPictureEnabled" in document &&
        video.requestPictureInPicture
      ) {
        pipRequestedRef.current = true;
        try {
          await video.requestPictureInPicture();
        } catch (error) {
          setPipUnavailable(true);
          logModel("requestPictureInPicture failed", error);
        }
      }
    };

    const onPlaying = () => {
      markReady();
    };

    const onCanPlay = async () => {
      try {
        if (video.paused) {
          await video.play();
        }
      } catch (error) {
        logModel("video.play() failed after canplay", error);
      }
      markReady();
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);

    if (video.readyState >= 2) {
      void onCanPlay();
    }

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [cameraGranted, videoReady]);

  const analyze = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const models = modelsRef.current;

    if (!video || !canvas || !models || !videoReady || video.readyState < 2) {
      if (video && cameraGrantedRef.current && !videoReady) {
        const now = Date.now();
        if (now - lastNoFrameLogRef.current > 3000) {
          lastNoFrameLogRef.current = now;
          logModel("Waiting for video frames before analysis", {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            paused: video.paused,
          });
        }
      }

      if (!models && cameraGrantedRef.current) {
        const now = Date.now();
        if (now - lastWaitLogRef.current > 3000) {
          lastWaitLogRef.current = now;
          logModel("Camera active but analysis waiting for models...");
        }
      }
      return;
    }

    const nowTs = performance.now();
    if (lastAnalyzeAtRef.current > 0 && nowTs - lastAnalyzeAtRef.current < analysisIntervalMs) {
      return;
    }
    lastAnalyzeAtRef.current = nowTs;

    if (analyzingRef.current) {
      return;
    }
    analyzingRef.current = true;

    try {
      const now = performance.now();

      const face = models.faceLandmarker.detectForVideo(video, now);
      const pose = models.poseLandmarker.detectForVideo(video, now);
      const detectedObjects = models.objectDetector.detectForVideo(video, now);

      const faceLandmarks = face.faceLandmarks?.[0];
      const hasFace = Boolean(faceLandmarks && faceLandmarks.length > 0);
      setIsPresent(hasFace);

      const usesPhone = (detectedObjects.detections ?? []).some((detection) =>
        (detection.categories ?? []).some((category) => category.categoryName === "cell phone"),
      );
      setIsUsingPhone(usesPhone);

      const poseLandmarks = pose.landmarks?.[0];

      let rawScore = 100;

      if (!hasFace) {
        rawScore -= 50;
        addAlert("away");
      }

      if (usesPhone) {
        rawScore -= 35;
        addAlert("phone");
      }

      const idleMs = Date.now() - lastMouseMove.current;
      if (idleMs > 70000) {
        rawScore -= 18;
        addAlert("idle");
      }

      if (hasFace && faceLandmarks) {
        const nose = faceLandmarks[1];
        const leftEye = faceLandmarks[33];
        const rightEye = faceLandmarks[263];
        const topHead = faceLandmarks[10];
        const bottomChin = faceLandmarks[152];

        const leftDist = dist(nose, leftEye);
        const rightDist = dist(nose, rightEye);
        const yawRatio = Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist);

        const topDist = dist(nose, topHead);
        const bottomDist = dist(nose, bottomChin);
        const pitchRatio = topDist / Math.max(0.001, topDist + bottomDist);

        const isYawFocused = yawRatio < 0.24;
        const isPitchFocused = pitchRatio > 0.38 && pitchRatio < 0.58;

        const previousNose = previousNoseRef.current;
        if (previousNose) {
          const noseDelta = dist(nose, previousNose);
          movementScoreRef.current = movementScoreRef.current * 0.82 + noseDelta * 0.18;
        }
        previousNoseRef.current = { x: nose.x, y: nose.y };

        const leftEAR = calcEAR(
          faceLandmarks,
          [33, 160, 158, 133, 153, 144],
        );
        const rightEAR = calcEAR(
          faceLandmarks,
          [362, 385, 387, 263, 373, 380],
        );

        const averageEAR =
          leftEAR !== null && rightEAR !== null
            ? (leftEAR + rightEAR) / 2
            : leftEAR ?? rightEAR;

        const eyesLikelyClosed = averageEAR !== null && averageEAR < 0.18;
        if (eyesLikelyClosed) {
          leftEyeClosedFramesRef.current += 1;
          rightEyeClosedFramesRef.current += 1;
        } else {
          leftEyeClosedFramesRef.current = Math.max(0, leftEyeClosedFramesRef.current - 1);
          rightEyeClosedFramesRef.current = Math.max(0, rightEyeClosedFramesRef.current - 1);
        }

        const prolongedEyeClosure =
          leftEyeClosedFramesRef.current >= 4 && rightEyeClosedFramesRef.current >= 4;

        if (!isYawFocused || !isPitchFocused) {
          rawScore -= 18;
          addAlert("away");
        }

        if (prolongedEyeClosure) {
          rawScore -= 14;
          addAlert("idle");
        }

        const movementNormalized = clamp01((movementScoreRef.current - 0.005) / 0.032);
        const movementPenalty = Math.round(movementNormalized * 34);
        rawScore -= movementPenalty;

        if (movementPenalty >= 6) {
          addAlert("motion");
        }
      }

      if (poseLandmarks && poseLandmarks.length > 16) {
        const leftShoulder = poseLandmarks[11];
        const rightShoulder = poseLandmarks[12];
        const leftWrist = poseLandmarks[15];
        const rightWrist = poseLandmarks[16];

        if (
          leftShoulder &&
          rightShoulder &&
          ((leftWrist && leftWrist.visibility && leftWrist.visibility > 0.5 && leftWrist.y < leftShoulder.y + 0.12) ||
            (rightWrist && rightWrist.visibility && rightWrist.visibility > 0.5 && rightWrist.y < rightShoulder.y + 0.12))
        ) {
          rawScore -= 22;
          addAlert("motion");
        }

        if (leftWrist && rightWrist && leftWrist.visibility && rightWrist.visibility) {
          const handVisible = leftWrist.visibility > 0.45 || rightWrist.visibility > 0.45;
          if (handVisible) {
            const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
            const handHigh =
              (leftWrist.visibility > 0.45 && leftWrist.y < shoulderMidY + 0.02) ||
              (rightWrist.visibility > 0.45 && rightWrist.y < shoulderMidY + 0.02);

            if (handHigh) {
              rawScore -= 14;
              addAlert("motion");
            }
          }
        }
      }

      if (cameraGrantedRef.current && engagementHistory.current.length > 8) {
        const lastThree = engagementHistory.current.slice(-3);
        const avgRecent =
          lastThree.length > 0
            ? lastThree.reduce((sum, value) => sum + value, 0) / lastThree.length
            : rawScore;

        if (rawScore > avgRecent + 14) {
          rawScore = Math.round(avgRecent + 14);
        }
      }

      rawScore = Math.max(5, Math.min(95, rawScore));
      scoreBuffer.current = [...scoreBuffer.current.slice(1), rawScore];
      const smoothed = Math.round(scoreBuffer.current.reduce((sum, v) => sum + v, 0) / scoreBuffer.current.length);
      setEngagementScore((previous) => {
        const upWeight = smoothed > previous ? 0.08 : 0.26;
        const eased = Math.round(previous * (1 - upWeight) + smoothed * upWeight);
        return Math.max(5, Math.min(95, eased));
      });

      engagementHistory.current.push(smoothed);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        if (faceLandmarks) {
          ctx.fillStyle = smoothed >= 70 ? "rgba(16, 185, 129, 0.65)" : "rgba(245, 158, 11, 0.65)";
          for (let i = 0; i < faceLandmarks.length; i += 6) {
            const pt = faceLandmarks[i];
            ctx.beginPath();
            ctx.arc(pt.x * width, pt.y * height, 1.4, 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        const phoneDetections = (detectedObjects.detections ?? []).filter((detection) =>
          (detection.categories ?? []).some((category) => category.categoryName === "cell phone"),
        );

        phoneDetections.forEach((detection) => {
          if (!detection.boundingBox) return;

          const { originX, originY, width: boxW, height: boxH } = detection.boundingBox;
          ctx.strokeStyle = "rgba(239, 68, 68, 0.95)";
          ctx.lineWidth = 2;
          ctx.strokeRect(originX, originY, boxW, boxH);
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("Phone", originX + 4, Math.max(14, originY - 4));
        });
      }
    } catch {
      // skip faulty frame
    } finally {
      analyzingRef.current = false;
    }
  }, [addAlert, videoReady]);

  useEffect(() => {
    if (!cameraGranted) return;

    let active = true;

    const loop = () => {
      if (!active) return;
      analyze();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cameraGranted, analyze]);

  useEffect(() => {
    if (!cameraGranted) return;

    const timer = setInterval(() => {
      setSessionTime((value) => value + 1);
      setFocusedTime((value) => (engagementScore >= 60 ? value + 1 : value));
    }, 1000);

    return () => clearInterval(timer);
  }, [cameraGranted, engagementScore]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && cameraGranted) {
        addAlert("tab");
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [addAlert, cameraGranted]);

  useEffect(() => {
    const update = () => {
      lastMouseMove.current = Date.now();
    };

    window.addEventListener("mousemove", update);
    window.addEventListener("keydown", update);
    window.addEventListener("touchstart", update);

    return () => {
      window.removeEventListener("mousemove", update);
      window.removeEventListener("keydown", update);
      window.removeEventListener("touchstart", update);
    };
  }, []);

  useEffect(() => {
    return () => {
      previousNoseRef.current = null;
      movementScoreRef.current = 0;
      leftEyeClosedFramesRef.current = 0;
      rightEyeClosedFramesRef.current = 0;
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraGranted) {
      return;
    }

    const tune = window.setTimeout(() => {
      const history = engagementHistory.current;
      const recentCount = history.length;

      if (recentCount <= 25) {
        return;
      }

      if (analysisIntervalMs < 420) {
        setAnalysisIntervalMs(360);
        logModel("Adaptive tuning: increased analysis interval to reduce lag", {
          intervalMs: 360,
          recentCount,
        });
      }
    }, 12000);

    return () => window.clearTimeout(tune);
  }, [cameraGranted, analysisIntervalMs]);

  const handleClose = () => {
    const averageEngagement =
      engagementHistory.current.length > 0
        ? Math.round(
            engagementHistory.current.reduce((sum, value) => sum + value, 0) /
              engagementHistory.current.length,
          )
        : engagementScore;

    onSessionSummary?.({
      averageEngagement,
      focusedTimeSec: focusedTime,
      totalTimeSec: sessionTime,
      alertsCount: alerts.length,
      distractedByPhoneCount: phoneAlertCount.current,
    });

    stopCamera();
    onClose();
  };

  const scoreColor =
    engagementScore >= 80
      ? "text-teal-600"
      : engagementScore >= 55
        ? "text-amber-500"
        : "text-rose-500";

  const scoreRingColor =
    engagementScore >= 80
      ? "#14b8a6"
      : engagementScore >= 55
        ? "#f59e0b"
        : "#ef4444";

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const focusPct = sessionTime > 0 ? Math.round((focusedTime / sessionTime) * 100) : 100;

  useEffect(() => {
    logModel(`videoReady state changed: ${videoReady}`);
  }, [videoReady]);

  if (phase === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)" }}
      >
        <div className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-8 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/30"
            >
              <Eye size={38} className="text-white" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl font-black text-white">Smart Attention</h2>
            <p className="text-sky-100 font-semibold mt-1">MediaPipe real-time engagement tracking</p>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="space-y-3">
              {[
                {
                  icon: "👁️",
                  label: "Face + posture analysis",
                  desc: "Tracks gaze and movement in real time.",
                },
                {
                  icon: "📵",
                  label: "Phone detection",
                  desc: "Detects cell phone usage and triggers smart alerts.",
                },
                {
                  icon: "📊",
                  label: "Engagement score",
                  desc: "Computes live concentration score from camera signals.",
                },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-start gap-3 bg-sky-50 p-3 rounded-2xl border border-sky-100"
                >
                  <span className="text-xl mt-0.5">{feature.icon}</span>
                  <div>
                    <p className="text-sm font-black text-slate-800">{feature.label}</p>
                    <p className="text-xs font-semibold text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 p-4 rounded-2xl">
              <div className="p-2 bg-teal-100 rounded-xl">
                <ShieldCheck size={20} className="text-teal-600" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-black text-teal-800">100% local processing</p>
                <p className="text-xs font-semibold text-teal-600">
                  Camera frames are processed in-browser and never uploaded.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
              Note: Some browsers print <code>XNNPACK delegate for CPU</code> even when GPU is requested.
              This is a TensorFlow Lite internal fallback message and can be normal.
            </div>

            {cameraError ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-700">
                <AlertTriangle size={16} strokeWidth={2.5} />
                <p className="text-xs font-bold">{cameraError}</p>
              </div>
            ) : null}

            {isModelLoading && !cameraError ? (
              <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 p-3 rounded-2xl text-sky-700">
                <Brain size={16} strokeWidth={2.5} className="animate-pulse" />
                <p className="text-xs font-bold">Preparing MediaPipe models in background...</p>
              </div>
            ) : null}

             <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all"
              >
                Skip for now
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={startCamera}
                disabled={isModelLoading}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black text-sm shadow-lg shadow-sky-400/30 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Camera size={18} strokeWidth={2.5} />
                {isModelLoading ? "Loading models..." : "Enable Camera"}
              </motion.button>
            </div>
            {pipUnavailable ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                Picture-in-Picture is not available in this browser. The tracker will stay in a floating window.
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.8, x: 20 }}
       animate={{ opacity: 1, scale: 1, x: 0 }}
       exit={{ opacity: 0, scale: 0.8 }}
       drag
       dragMomentum={false}
       className="fixed bottom-6 left-[calc(var(--student-sidebar-width,240px)+6px)] z-[60] select-none cursor-move"
       style={{ touchAction: "none" }}
     >
      {minimized ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setMinimized(false)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl border-2 font-black text-sm backdrop-blur-xl ${
            engagementScore >= 80
              ? "bg-teal-50/90 border-teal-300 text-teal-700"
              : engagementScore >= 55
                ? "bg-amber-50/90 border-amber-300 text-amber-700"
                : "bg-rose-50/90 border-rose-300 text-rose-600"
          }`}
        >
          <Eye size={14} strokeWidth={2.5} />
          {engagementScore}% focus
        </motion.button>
      ) : (
        <div
          className="w-72 bg-white/95 backdrop-blur-xl rounded-[1.75rem] shadow-2xl border border-white overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        >
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cameraGranted ? "bg-teal-400 animate-pulse" : "bg-rose-400"}`} />
              <span className="text-white text-[11px] font-black uppercase tracking-widest">Smart Attention</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled((value) => !value)}
                className="text-slate-400 hover:text-white transition-colors"
                title={soundEnabled ? "Disable alert sound" : "Enable alert sound"}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button onClick={() => setMinimized(true)} className="text-slate-400 hover:text-white transition-colors text-xs font-black px-1">
                —
              </button>
              <button onClick={handleClose} className="text-slate-400 hover:text-rose-400 transition-colors font-black text-base leading-none">
                ×
              </button>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-[10px] font-semibold text-slate-600 flex items-center justify-between">
            <span>Delegate: {activeDelegate ?? "Auto"}</span>
            <span>Inference: {analysisIntervalMs}ms</span>
          </div>

            <div className="relative bg-slate-900 aspect-video overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              muted
              playsInline
              autoPlay
              onLoadedMetadata={() => {
                const video = videoRef.current;
                logModel("video loadedmetadata event", {
                  readyState: video?.readyState,
                  videoWidth: video?.videoWidth,
                  videoHeight: video?.videoHeight,
                });
              }}
              onPlaying={() => {
                logModel("video playing event");
                setVideoReady(true);
              }}
              onError={(event) => {
                logModel("video element error event", event);
              }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

              {!videoReady ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-slate-700">
                    <Camera size={14} className="animate-pulse text-sky-600" />
                    Starting camera preview...
                  </div>
                </div>
              ) : null}

              {!modelsReady ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-slate-700">
                    <Brain size={14} className="animate-pulse text-sky-600" />
                    Loading MediaPipe models...
                  </div>
                </div>
              ) : null}

            <div className="absolute top-2 left-2 right-2 flex justify-between">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black backdrop-blur-sm ${isPresent ? "bg-teal-500/80 text-white" : "bg-rose-500/80 text-white"}`}>
                {isPresent ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isPresent ? "Detected" : "Away"}
              </div>

              {isUsingPhone ? (
                <div className="bg-rose-500/90 text-white text-[10px] font-black px-2 py-1 rounded-full backdrop-blur-sm inline-flex items-center gap-1">
                  <Smartphone size={10} /> Phone
                </div>
              ) : (
                <div className="bg-black/60 text-white text-[10px] font-black px-2 py-1 rounded-full backdrop-blur-sm">
                  {formatTime(sessionTime)}
                </div>
              )}
            </div>

            <div className="absolute bottom-2 right-2 w-12 h-12">
              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={scoreRingColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(engagementScore / 100) * 125.6} 125.6`}
                  style={{ filter: `drop-shadow(0 0 4px ${scoreRingColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[11px] font-black ${scoreColor} drop-shadow`}>{engagementScore}</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-black text-slate-500">Engagement Score</span>
                <span className={`text-[13px] font-black ${scoreColor}`}>{engagementScore}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${engagementScore}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${scoreRingColor}, ${scoreRingColor}cc)`,
                    boxShadow: `0 0 8px ${scoreRingColor}60`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Session", value: formatTime(sessionTime), icon: <Move size={11} /> },
                { label: "Focused", value: formatTime(focusedTime), icon: <Eye size={11} /> },
                { label: "Efficiency", value: `${focusPct}%`, icon: <Brain size={11} /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                  <div className="inline-flex items-center justify-center text-slate-500 mb-0.5">{stat.icon}</div>
                  <p className="text-[13px] font-black text-slate-800">{stat.value}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {alerts.length > 0 ? (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Smart Alerts</p>
                <div className="space-y-1 max-h-24 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-[10px] font-bold ${
                        alert.type === "away"
                          ? "bg-amber-50 text-amber-700"
                          : alert.type === "tab" || alert.type === "phone"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>{alertMessages[alert.type].icon}</span>
                      <span className="flex-1">{alert.message}</span>
                      <span className="opacity-50 text-[9px]">
                        {alert.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400">
              <ShieldCheck size={10} className="text-teal-400" />
              Local MediaPipe processing · No video saved
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
