"use client";

import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { RefreshCw } from "lucide-react";

interface ThumbnailSelectorProps {
  thumbnailOptions: string[];
  onSelectThumbnail: (thumbnail: string) => void;
  onRegenerate: () => void;
}

export const ThumbnailSelector = ({
  thumbnailOptions,
  onSelectThumbnail,
  onRegenerate,
}: ThumbnailSelectorProps) => {
  if (thumbnailOptions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FormLabel className="text-white">Select Thumbnail</FormLabel>
        <Button
          type="button"
          onClick={onRegenerate}
          className="h-8 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          {thumbnailOptions.length > 0 ? "Generate new" : "Regenerate"}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {thumbnailOptions.map((thumb, index) => (
          <button
            type="button"
            key={thumb}
            onClick={() => onSelectThumbnail(thumb)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelectThumbnail(thumb);
              }
            }}
            className="w-full h-auto p-0 border-2 border-transparent hover:border-red-600 rounded transition-all focus:outline-none focus:ring-2 focus:ring-red-600"
            aria-label={`Select thumbnail ${index + 1}`}
          >
            <img
              src={thumb}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-auto rounded"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
