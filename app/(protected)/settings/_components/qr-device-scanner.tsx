"use client";

import { Camera, LoaderCircle, QrCode, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";

const PAIR_SECRET_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

type ScannerControls = {
  stop: () => void;
};

type ScannerStatus = "closed" | "starting" | "scanning" | "invalid" | "error";

export function getQrApprovalPath(value: string, currentOrigin: string) {
  try {
    const url = new URL(value, currentOrigin);
    const pairSecret = url.searchParams.get("pair");
    const parameterNames = Array.from(url.searchParams.keys());

    if (
      url.origin !== currentOrigin ||
      url.pathname !== "/auth/qr/approve" ||
      parameterNames.length !== 1 ||
      parameterNames[0] !== "pair" ||
      !pairSecret ||
      !PAIR_SECRET_PATTERN.test(pairSecret)
    ) {
      return null;
    }

    return `/auth/qr/approve?pair=${encodeURIComponent(pairSecret)}`;
  } catch {
    return null;
  }
}

export function QrDeviceScanner() {
  const { t } = useLanguage();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const [status, setStatus] = useState<ScannerStatus>("closed");
  const isOpen = status !== "closed";

  useEffect(() => {
    if (!isOpen) return;

    let isActive = true;
    let controls: ScannerControls | null = null;

    const startScanner = async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (!isActive || !videoRef.current) return;

        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: { facingMode: { ideal: "environment" } },
          },
          videoRef.current,
          (result, _error, callbackControls) => {
            if (!isActive || !result) return;

            const approvalPath = getQrApprovalPath(
              result.getText(),
              window.location.origin,
            );
            if (!approvalPath) {
              setStatus("invalid");
              return;
            }

            isActive = false;
            callbackControls.stop();
            controlsRef.current = null;
            router.push(approvalPath);
          },
        );

        if (!isActive) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus("scanning");
      } catch {
        if (isActive) setStatus("error");
      }
    };

    void startScanner();

    return () => {
      isActive = false;
      controls?.stop();
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [isOpen, router]);

  const closeScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setStatus("closed");
  };

  return (
    <section className="mb-6 min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <QrCode className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">
              {t("Sign in another device")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              {t("Scan the QR code shown on the other device with this phone.")}
            </p>
          </div>
        </div>

        {!isOpen && (
          <button
            type="button"
            onClick={() => setStatus("starting")}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:w-auto"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {t("Scan QR code")}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-5 min-w-0 border-t border-white/10 pt-5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black sm:aspect-video">
            <video
              ref={videoRef}
              aria-label={t("Camera preview for QR code scanning")}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-1/2 aspect-square w-[58%] max-w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]"
            />
            {status === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <LoaderCircle className="h-8 w-8 animate-spin text-white" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm leading-6 text-zinc-300" role="status">
              {status === "error"
                ? t("Camera access failed. Allow camera access or enter the code manually.")
                : status === "invalid"
                  ? t("This is not a valid sign-in QR code. Point the camera at the code on the other device.")
                  : t("Point the camera at the sign-in QR code on the other device.")}
            </p>
            <button
              type="button"
              onClick={closeScanner}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08] sm:w-auto"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {t("Close scanner")}
            </button>
          </div>
        </div>
      )}

      <Link
        href="/auth/qr/approve"
        className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-white"
      >
        {t("Enter a code manually")}
      </Link>
    </section>
  );
}
