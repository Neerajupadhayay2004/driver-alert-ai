import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  error: string | null;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Unable to access webcam. Please check permissions.');
      setIsStreaming(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return {
    videoRef,
    isStreaming,
    error,
    startWebcam,
    stopWebcam,
  };
}
