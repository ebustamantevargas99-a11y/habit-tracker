"use client";

/**
 * Barcode Scanner — cámara + BarcodeDetector API nativo.
 *
 * Usa la Shape Detection API de Chrome/Edge/Android (zero-kb, nativa). Para
 * Safari iOS (no la soporta aún) muestra fallback: input manual.
 *
 * Formatos soportados: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128 (cubre el 99%
 * de productos comestibles del mundo, todos los cuales están en OpenFoodFacts).
 *
 * Una vez detectado el código, llama a onDetected(code) — el caller decide
 * si consultar /nutrition/barcode/[code] o hacer otra cosa.
 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CameraOff, Keyboard, X } from "lucide-react";
import { Card, cn } from "@/components/ui";

// Tipos mínimos para BarcodeDetector (no está aún en lib.dom.d.ts en TS 5.x)
interface DetectedBarcode {
  rawValue: string;
  format: string;
}
interface BarcodeDetectorInstance {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

const WANTED_FORMATS = [
  "ean_13", "ean_8", "upc_a", "upc_e", "code_128",
];

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);

  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<
    "idle" | "requesting" | "streaming" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // Detecta soporte al montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSupported = "BarcodeDetector" in window;
    setSupported(isSupported);
    if (!isSupported) setManualMode(true);
  }, []);

  // Iniciar cámara si supported
  useEffect(() => {
    if (!supported || manualMode) return;
    let cancelled = false;

    async function start() {
      setStatus("requesting");
      setError(null);
      try {
        if (!window.BarcodeDetector) {
          throw new Error("BarcodeDetector no disponible");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();

        detectorRef.current = new window.BarcodeDetector({
          formats: WANTED_FORMATS,
        });
        setStatus("streaming");

        // Loop de detección — 6 fps para no drenar batería
        let lastTick = 0;
        const loop = async (ts: number) => {
          if (cancelled) return;
          if (ts - lastTick > 160) {
            lastTick = ts;
            try {
              const results = await detectorRef.current?.detect(v);
              const code = results?.[0]?.rawValue;
              if (code && /^\d{8,20}$/.test(code)) {
                cleanup();
                onDetected(code);
                return;
              }
            } catch {
              // ignorar fallos puntuales de detección
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setError(
              "Permiso denegado. Habilita la cámara en los permisos del navegador.",
            );
          } else if (err.name === "NotFoundError") {
            setError("No se detectó ninguna cámara.");
          } else {
            setError(err.message);
          }
        } else {
          setError("Error iniciando cámara");
        }
      }
    }

    function cleanup() {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    void start();
    return cleanup;
  }, [supported, manualMode, onDetected]);

  function handleManual() {
    if (/^\d{8,20}$/.test(manualCode.trim())) {
      onDetected(manualCode.trim());
    } else {
      setError("Código inválido (8-20 dígitos)");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-brand-dark/80 flex items-center justify-center p-4">
      <Card
        variant="default"
        padding="none"
        className="w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-light-cream bg-brand-paper">
          <div className="flex items-center gap-2">
            {manualMode ? (
              <Keyboard size={16} className="text-accent" />
            ) : (
              <Camera size={16} className="text-accent" />
            )}
            <h3 className="font-serif text-base text-brand-dark m-0">
              {manualMode ? "Introducir código" : "Escanear código de barras"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-brand-cream text-brand-warm"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        {!manualMode ? (
          <div className="relative bg-black aspect-[4/3] w-full">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Marco de ayuda */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-4/5 h-1/3 border-2 border-accent rounded-lg relative">
                <div className="absolute -top-px -left-px w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute -top-px -right-px w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>

            {status === "requesting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                Pidiendo permiso de cámara…
              </div>
            )}
            {status === "error" && error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                <div className="text-center text-white max-w-xs">
                  <CameraOff size={32} className="mx-auto mb-2 opacity-60" />
                  <p className="text-sm m-0">{error}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5">
            <p className="text-xs text-brand-warm mb-3">
              {supported === false
                ? "Tu navegador no soporta escaneo con cámara (iOS Safari aún no implementa la API). Ingresa el código manualmente."
                : "Ingresa el código EAN/UPC del producto."}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManual()}
              autoFocus
              placeholder="3017620422003"
              className="w-full px-3 py-2 rounded border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono"
            />
            {error && (
              <p className="text-xs text-danger mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className={cn(
            "px-4 py-3 border-t border-brand-light-cream bg-brand-paper flex justify-between items-center gap-2",
          )}
        >
          {supported ? (
            <button
              onClick={() => {
                setError(null);
                setManualMode((v) => !v);
              }}
              className="text-xs text-brand-medium hover:text-brand-dark underline"
              type="button"
            >
              {manualMode ? "← Escanear con cámara" : "Ingresar código manualmente →"}
            </button>
          ) : (
            <span className="text-xs text-brand-warm">
              Se consulta OpenFoodFacts (3M+ productos)
            </span>
          )}
          {manualMode && (
            <button
              onClick={handleManual}
              disabled={!manualCode.trim()}
              className="px-4 py-1.5 rounded-button bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              type="button"
            >
              Buscar
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
