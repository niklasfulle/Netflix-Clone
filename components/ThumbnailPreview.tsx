"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FormLabel } from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Loader2, Upload, X } from "lucide-react";

interface ThumbnailPreviewProps {
  thumbnailUrl: string;
  onDeselect?: () => void;
  onManualUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDeselect?: boolean;
  useImage?: boolean;
  selectedTimestamp?: number | null;
  videoDuration?: number;
  isAdjusting?: boolean;
  adjustmentError?: boolean;
  onAdjustThumbnail?: (seconds: -5 | 5) => void;
}

export const ThumbnailPreview = ({
  thumbnailUrl,
  onDeselect,
  onManualUpload,
  showDeselect = true,
  useImage = false,
  selectedTimestamp = null,
  videoDuration = 0,
  isAdjusting = false,
  adjustmentError = false,
  onAdjustThumbnail,
}: ThumbnailPreviewProps) => {
  const { t } = useLanguage();
  const seconds = Math.floor(selectedTimestamp ?? 0);
  const timestamp = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .filter((_, position) => position > 0 || seconds >= 3600)
    .map((value) => String(value).padStart(2, "0")).join(":");

  return (
    <>
      {thumbnailUrl && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <FormLabel className="text-white">
              {t(useImage ? "Selected Thumbnail" : "Current Thumbnail")}
            </FormLabel>
            {showDeselect && onDeselect && (
              <Button
                type="button"
                onClick={onDeselect}
                disabled={isAdjusting}
                className="h-8 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                {t("Deselect")}
              </Button>
            )}
          </div>
          <div className="relative" aria-busy={isAdjusting}>
          {useImage ? (
            <Image
              src={thumbnailUrl}
              alt={t("Selected Thumbnail")}
              width={1920}
              height={1080}
              unoptimized={thumbnailUrl.startsWith("blob:") || thumbnailUrl.startsWith("data:")}
              className="w-full h-auto rounded border-2 border-green-500"
            />
          ) : (
            <Image
              src={thumbnailUrl}
              alt={t("movie thumbnail")}
              width={1920}
              height={1080}
              className="rounded-xl border-2 border-green-500"
            />
          )}
          {isAdjusting && (
            <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
              <Loader2 className="h-10 w-10 motion-safe:animate-spin text-white" />
            </div>
          )}
          </div>
          {onAdjustThumbnail && selectedTimestamp !== null && videoDuration > 0 && (
            <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" onClick={() => onAdjustThumbnail(-5)} disabled={isAdjusting || selectedTimestamp <= 0} className="bg-zinc-700 text-white hover:bg-zinc-600">
                  <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
                  {t("5 seconds earlier")}
                </Button>
                <output className="text-sm text-zinc-200">
                  {isAdjusting ? t("Updating thumbnail...") : <span className="font-mono tabular-nums">{timestamp}</span>}
                </output>
                <Button type="button" onClick={() => onAdjustThumbnail(5)} disabled={isAdjusting || selectedTimestamp >= videoDuration - 0.05} className="bg-zinc-700 text-white hover:bg-zinc-600">
                  {t("5 seconds later")}
                  <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-zinc-400">{t("Move through the video to fine-tune your thumbnail. The new frame is selected automatically.")}</p>
              {adjustmentError && <p role="alert" className="mt-2 text-sm text-red-300">{t("Thumbnail could not be updated. Your previous image is still selected. Try again.")}</p>}
            </div>
          )}
        </div>
      )}

      {onManualUpload && (
        <div>
          <FormLabel className="text-white block mb-2">
            {t("Or upload thumbnail manually")}
          </FormLabel>
          <div className="relative">
            <input
              id="thumbnail-upload"
              className="hidden"
              type="file"
              accept="image/*"
              onChange={onManualUpload}
              disabled={isAdjusting}
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-400">
                <Upload className="w-5 h-5" />
                <span className="text-sm">
                  {t(useImage ? "Upload Thumbnail" : "Upload new thumbnail")}
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </>
  );
};
