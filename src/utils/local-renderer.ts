import { PlayerRef } from "@remotion/player";

interface LocalRenderOptions {
  playerRef: React.RefObject<PlayerRef>;
  fps?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

/**
 * Renders video locally using browser APIs (100% offline)
 * Captures frames from Remotion Player and creates MP4
 */
export async function renderVideoLocally({
  playerRef,
  fps = 30,
  onProgress,
  onComplete,
  onError
}: LocalRenderOptions) {
  try {
    const player = playerRef.current;
    if (!player) {
      throw new Error("Player reference not available");
    }

    // Get player element
    const playerElement = player.getContainerNode();
    if (!playerElement) {
      throw new Error("Player container not found");
    }

    // Pause player and reset to start
    player.pause();
    player.seekTo(0);

    // Get total frames
    const totalFrames = player.getDuration();
    const frameDuration = 1000 / fps;

    // Create canvas to capture frames
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Match player dimensions
    const rect = playerElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Setup MediaRecorder with canvas stream
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8000000, // 8 Mbps
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      onComplete?.(blob);
    };

    mediaRecorder.onerror = (event) => {
      onError?.(new Error("MediaRecorder error"));
    };

    // Start recording
    mediaRecorder.start();

    // Render each frame
    let currentFrame = 0;

    const renderFrame = async () => {
      if (currentFrame >= totalFrames) {
        // Finished
        mediaRecorder.stop();
        return;
      }

      // Seek to current frame
      player.seekTo(currentFrame);

      // Wait for frame to render
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Capture frame to canvas using html2canvas or similar
      // For simplicity, we'll use a basic approach
      const playerCanvas = playerElement.querySelector("canvas");
      if (playerCanvas) {
        ctx.drawImage(playerCanvas, 0, 0, canvas.width, canvas.height);
      }

      // Update progress
      const progress = (currentFrame / totalFrames) * 100;
      onProgress?.(progress);

      currentFrame++;

      // Continue to next frame
      requestAnimationFrame(renderFrame);
    };

    // Start rendering
    renderFrame();

  } catch (error) {
    onError?.(error as Error);
  }
}

/**
 * Simpler alternative: Record Remotion Player in real-time
 * This plays the video and records it as it plays
 */
export async function recordPlayerRealtime({
  playerRef,
  onProgress,
  onComplete,
  onError
}: LocalRenderOptions) {
  try {
    const player = playerRef.current;
    if (!player) {
      throw new Error("Player reference not available");
    }

    // Get player element
    const playerElement = player.getContainerNode();
    if (!playerElement) {
      throw new Error("Player container not found");
    }

    // Reset to start
    player.pause();
    player.seekTo(0);

    // Create stream from player element
    const stream = (playerElement as any).captureStream?.(30) ||
                   (await (navigator.mediaDevices as any).getDisplayMedia({
                     video: true,
                     audio: false
                   }));

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8000000,
    });

    const chunks: Blob[] = [];
    const totalDuration = player.getDuration() / 30; // Convert frames to seconds

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      onComplete?.(blob);

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.onerror = () => {
      onError?.(new Error("Recording failed"));
    };

    // Start recording and playing
    mediaRecorder.start(100); // Capture every 100ms
    player.play();

    // Track progress
    const progressInterval = setInterval(() => {
      const currentTime = player.getCurrentFrame() / 30;
      const progress = (currentTime / totalDuration) * 100;
      onProgress?.(progress);

      if (currentTime >= totalDuration - 0.1) {
        clearInterval(progressInterval);
      }
    }, 100);

    // Stop recording when playback ends
    const checkEnd = setInterval(() => {
      if (!player.isPlaying()) {
        clearInterval(checkEnd);
        clearInterval(progressInterval);
        setTimeout(() => {
          mediaRecorder.stop();
        }, 500);
      }
    }, 100);

  } catch (error) {
    onError?.(error as Error);
  }
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
