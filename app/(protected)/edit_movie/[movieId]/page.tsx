"use client";
import { isMobile } from "react-device-detect";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EditMovieForm } from "./_components/edit-movie-form";
import { useParams } from "next/navigation";
import useMovie from "@/hooks/movies/useMovie";

export default function Add() {
  const movieId = useParams<{ movieId: string }>().movieId;
  const { data: movie } = useMovie(movieId);

  if (movie == undefined) {
    return null;
  }

  return (
    <>
      <Navbar />
      {!isMobile && (
        <div className="py-20 flex felx-row items-center justify-center px-2 pt-28 pb-32">
          <Card className="w-[600px] bg-zinc-800 text-white mt-20 border-none md:border-solid">
            <CardHeader>
              <p className="text-2xl font-semibold text-center ">Edit Movie</p>
            </CardHeader>
            <CardContent>
              <EditMovieForm movie={movie} />
            </CardContent>
          </Card>
        </div>
      )}
      {isMobile && (
        <div className="h-svh flex felx-row items-center justify-center px-2 pt-40 mb-48 ">
          <Card className="w-full bg-zinc-800 text-white mt-20 border-none md:border-solid">
            <CardHeader>
              <p className="text-2xl font-semibold text-center ">Edit Movie</p>
            </CardHeader>
            <CardContent>
              <EditMovieForm movie={movie} />
            </CardContent>
          </Card>
        </div>
      )}
      <Footer />
    </>
  );
}
