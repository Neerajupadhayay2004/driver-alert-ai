// Singleton face-api.js model loader for instant startup
import * as faceapi from 'face-api.js';

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

class FaceApiLoader {
  private static instance: FaceApiLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private loadError: string | null = null;
  private listeners: Set<(loaded: boolean, error?: string) => void> = new Set();

  private constructor() {
    // Start loading immediately on instantiation
    this.loadModels();
  }

  static getInstance(): FaceApiLoader {
    if (!FaceApiLoader.instance) {
      FaceApiLoader.instance = new FaceApiLoader();
    }
    return FaceApiLoader.instance;
  }

  private async loadModels(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        console.log('[FaceAPI] Starting model preload...');
        const startTime = performance.now();

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ]);

        const loadTime = (performance.now() - startTime).toFixed(0);
        console.log(`[FaceAPI] Models loaded in ${loadTime}ms`);

        this.isLoaded = true;
        this.loadError = null;
        this.notifyListeners();
      } catch (err) {
        console.error('[FaceAPI] Model loading failed:', err);
        this.loadError = 'Failed to load AI models. Please refresh.';
        this.notifyListeners();
      }
    })();

    return this.loadPromise;
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.isLoaded, this.loadError ?? undefined);
    });
  }

  subscribe(listener: (loaded: boolean, error?: string) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.isLoaded, this.loadError ?? undefined);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  get loaded(): boolean {
    return this.isLoaded;
  }

  get error(): string | null {
    return this.loadError;
  }

  async waitForLoad(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) await this.loadPromise;
  }
}

// Initialize immediately when module is imported
export const faceApiLoader = FaceApiLoader.getInstance();

// Also export for direct access
export { faceapi };
