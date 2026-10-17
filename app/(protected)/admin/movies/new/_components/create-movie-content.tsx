"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clapperboard,
  ImageIcon,
  Upload,
  Users,
} from "lucide-react";

import { AddMovieForm } from "@/app/(protected)/add/_components/add-movie-form";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const workflow = [
  {
    icon: Clapperboard,
    title: "Content Details",
    description: "Enter the title, description, type, genre, and duration.",
  },
  {
    icon: Users,
    title: "Cast",
    description: "Assign existing actors or create missing entries directly in the form.",
  },
  {
    icon: Upload,
    title: "Upload Video",
    description: "Select a video file and complete the upload.",
  },
  {
    icon: ImageIcon,
    title: "Thumbnail",
    description: "Select a generated image or upload your own.",
  },
] as const;

export default function AdminCreateMovieContent() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Add New Content")}
        description={t("Add movies and series directly in the admin area and prepare them for the catalog.")}
        actions={
          <Link
            href="/admin/movies"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("Back to Content Management")}
          </Link>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl shadow-black/10">
          <div className="flex items-start gap-4 border-b border-zinc-800 bg-zinc-900/70 px-5 py-5 sm:px-7">
            <span className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
              <Clapperboard className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-white">{t("Content Details")}</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {t("Complete the required fields, upload the video, and then choose a thumbnail.")}
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-7 lg:p-8">
            <AddMovieForm />
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-8" aria-label={t("Creation Guidance")}>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-white">{t("Workflow")}</h2>
                <p className="text-xs text-zinc-500">{t("Four steps to new content")}</p>
              </div>
            </div>
            <ol className="space-y-5">
              {workflow.map(({ icon: Icon, title, description }, index) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-xs font-semibold text-zinc-300">
                    {index + 1}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      <Icon className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                      {t(title)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{t(description)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h2 className="text-sm font-semibold text-amber-200">{t("Before Saving")}</h2>
            <p className="mt-2 text-xs leading-5 text-amber-100/60">
              {t("Check the title, assignments, and image selection. After saving, the content appears in content management and can be edited there.")}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
