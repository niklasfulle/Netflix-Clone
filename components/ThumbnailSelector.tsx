"use client";

import Image from "next/image";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Check, ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ThumbnailSelectorProps {
  thumbnailOptions: string[];
  thumbnailTimestamps?: number[];
  isGenerating?: boolean;
  generationError?: boolean;
  onSelectThumbnail: (thumbnail: string) => void;
  onRegenerate: () => void;
}

export const ThumbnailSelector = ({
  thumbnailOptions,
  thumbnailTimestamps = [],
  isGenerating = false,
  generationError = false,
  onSelectThumbnail,
  onRegenerate,
}: ThumbnailSelectorProps) => {
  const { t, message } = useLanguage();
  const headingId = useId();
  if (thumbnailOptions.length === 0 && !isGenerating && !generationError) return null;
  const completed = thumbnailOptions.length;
  const slots = isGenerating ? 6 : completed;
  const regenerateLabel = generationError ? "Try again" : "Generate new";

  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 id={headingId} className="text-sm font-semibold text-white">{t("Select Thumbnail")}</h3>
        <Button
          type="button"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="h-9 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
        >
          <RefreshCw aria-hidden="true" className={`mr-2 h-4 w-4 ${isGenerating ? "motion-safe:animate-spin" : ""}`} />
          {t(isGenerating ? "Generating previews..." : regenerateLabel)}
        </Button>
      </div>
      <div className={`mb-4 rounded-lg border p-3 ${generationError ? "border-red-500/40 bg-red-500/10" : "border-zinc-700 bg-zinc-800/70"}`}>
        {generationError ? (
          <p role="alert" className="text-sm text-red-200">{t("Preview generation failed. Try again or upload an image manually.")}</p>
        ) : (
          <output className="flex items-center gap-2 text-sm text-zinc-100">
            {isGenerating ? <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 motion-safe:animate-spin text-red-400" /> : <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-green-400" />}
            {isGenerating ? message("thumbnailGenerationProgress", { count: completed, total: 6 }) : t("New previews are ready. Select your favorite image.")}
          </output>
        )}
        {isGenerating && (
          <>
            <progress aria-label={t("Preview generation")} value={completed} max={6} className="mt-3 block h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-zinc-700 [&::-webkit-progress-value]:bg-red-500 [&::-moz-progress-bar]:bg-red-500" />
            <p className="mt-2 text-xs text-zinc-400">{t("Images appear one by one. Please wait until generation finishes.")}</p>
          </>
        )}
      </div>
      <div aria-busy={isGenerating} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: slots }, (_, index) => {
          const thumb = thumbnailOptions[index];
          if (!thumb) return (
            <div key={`pending-${index}`} aria-hidden="true" className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-600 bg-zinc-800 motion-safe:animate-pulse">
              <ImageIcon className="h-7 w-7 text-zinc-500" />
              <span className="text-xs text-zinc-400">{message("thumbnailOption", { number: index + 1 })}</span>
            </div>
          );
          const seconds = Math.floor(thumbnailTimestamps[index] ?? 0);
          const timestamp = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
            .filter((_, position) => position > 0 || seconds >= 3600)
            .map((value) => String(value).padStart(2, "0")).join(":");
          return (
          <button
            type="button"
            key={`${index}-${thumb}`}
            disabled={isGenerating}
            onClick={() => onSelectThumbnail(thumb)}
            onKeyDown={(e) => {
              if (!isGenerating && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelectThumbnail(thumb);
              }
            }}
            className="group relative aspect-video w-full overflow-hidden rounded-lg border-2 border-transparent p-0 transition-colors enabled:hover:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait"
            aria-label={message("selectThumbnail", { number: index + 1 })}
          >
            <Image
              src={thumb}
              alt={message("thumbnailOption", { number: index + 1 })}
              width={480}
              height={270}
              unoptimized
              className="h-full w-full object-contain bg-black"
              draggable={false}
            />
            <span aria-hidden="true" className="absolute bottom-0 inset-x-0 flex justify-between gap-2 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-5 text-xs text-white">
              <span>{message("thumbnailOption", { number: index + 1 })}</span>
              {thumbnailTimestamps[index] !== undefined && <span className="font-mono tabular-nums">{timestamp}</span>}
            </span>
          </button>
          );
        })}
      </div>
    </section>
  );
};
