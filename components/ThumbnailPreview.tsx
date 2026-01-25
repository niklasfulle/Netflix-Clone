"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Upload, X } from "lucide-react";

interface ThumbnailPreviewProps {
  thumbnailUrl: string;
  onDeselect?: () => void;
  onManualUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDeselect?: boolean;
  useImage?: boolean;
}

export const ThumbnailPreview = ({
  thumbnailUrl,
  onDeselect,
  onManualUpload,
  showDeselect = true,
  useImage = false,
}: ThumbnailPreviewProps) => {
  return (
    <>
      {thumbnailUrl && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <FormLabel className="text-white">
              {useImage ? "Selected Thumbnail" : "Current Thumbnail"}
            </FormLabel>
            {showDeselect && onDeselect && (
              <Button
                type="button"
                onClick={onDeselect}
                className="h-8 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Deselect
              </Button>
            )}
          </div>
          {useImage ? (
            <img
              src={thumbnailUrl}
              alt="Selected Thumbnail"
              className="w-full h-auto rounded border-2 border-green-500"
            />
          ) : (
            <Image
              src={thumbnailUrl}
              alt="movie thumbnail"
              width={1920}
              height={1080}
              className="rounded-xl border-2 border-green-500"
            />
          )}
        </div>
      )}

      {onManualUpload && (
        <div>
          <FormLabel className="text-white block mb-2">
            Or upload thumbnail manually
          </FormLabel>
          <div className="relative">
            <input
              id="thumbnail-upload"
              className="hidden"
              type="file"
              accept="image/*"
              onChange={onManualUpload}
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-400">
                <Upload className="w-5 h-5" />
                <span className="text-sm">
                  {useImage ? "Upload Thumbnail" : "Upload new thumbnail"}
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </>
  );
};
