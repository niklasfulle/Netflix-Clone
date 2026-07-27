"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Upload, X, Check } from "lucide-react";

interface VideoUploadFieldProps {
  videoFile: File | null;
  generatedVideoId?: string;
  uploadProgress: number;
  isUploading: boolean;
  uploadedVideoPath: string;
  isPending: boolean;
  currentVideoUrl?: string;
  isOptional?: boolean;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
  estimatedTime?: string;
  uploadDisabled?: boolean;
  isUploaded?: boolean;
}

export const VideoUploadField = ({
  videoFile,
  generatedVideoId,
  uploadProgress,
  isUploading,
  uploadedVideoPath,
  isPending,
  currentVideoUrl,
  isOptional = false,
  onVideoChange,
  onUpload,
  onCancel,
  estimatedTime,
  uploadDisabled = false,
  isUploaded = Boolean(uploadedVideoPath),
}: VideoUploadFieldProps) => {
  const { t } = useLanguage();

  return (
    <div>
      <label className="text-white block mb-2">
        {t(isOptional ? "Upload Video (optional)" : "Upload Video")}
      </label>
      <div className="mt-2 space-y-3">
        <div className="relative">
          <input
            id="video-upload"
            className="hidden"
            type="file"
            accept="video/*"
            onChange={onVideoChange}
            disabled={isPending || isUploading}
          />
          <label
            htmlFor="video-upload"
            className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              videoFile
                ? "border-green-500 bg-green-900/20"
                : "border-gray-500 bg-zinc-800 hover:bg-zinc-700 hover:border-gray-400"
            } ${(isPending || isUploading) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              {videoFile ? (
                <>
                  <Check className="w-10 h-10 text-green-500 mb-2" />
                  <p
                    className="text-sm text-white font-medium truncate max-w-xs px-2"
                    title={videoFile.name}
                  >
                    {videoFile.name.length > 40
                      ? `${videoFile.name.substring(0, 37)}...`
                      : videoFile.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {generatedVideoId && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      ID: {generatedVideoId}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-white">
                    {t(isOptional
                      ? "Click to select a new video"
                      : "Click to select a video")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {currentVideoUrl
                      ? t(`Current: ${currentVideoUrl}`)
                      : t("MP4 file, max. 2GB")}
                  </p>
                </>
              )}
            </div>
          </label>
        </div>

        {videoFile && (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onUpload}
              disabled={isUploading || isPending || !!uploadedVideoPath || uploadDisabled}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
            >
              {(() => {
                if (isUploading) {
                  return (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-pulse" />
                      {t(`Uploading... ${uploadProgress}%`)}
                    </>
                  );
                }
                if (isUploaded) {
                  return (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {t("Uploaded")}
                    </>
                  );
                }
                return (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t("Upload Video")}
                  </>
                );
              })()}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              disabled={isPending || isUploading}
              className="h-11 px-4 bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="w-full">
            <div className="bg-zinc-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{uploadProgress}%</span>
              {estimatedTime && <span>{t(`~${estimatedTime} left`)}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
