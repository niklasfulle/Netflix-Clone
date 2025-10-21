"use client";
import { isMobile } from "react-device-detect";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { AddMovieForm } from "./_components/add-movie-form";

export default function Add() {
  return (
    <>
      <Navbar />
      {!isMobile && (
        <div className="py-28 flex felx-row items-center justify-center px-2 pt-52 mb-56">
          <Card className="w-[600px] bg-zinc-800 text-white mt-20 border-none md:border-solid">
            <CardHeader>
              <p className="text-2xl font-semibold text-center ">Add Movie</p>
            </CardHeader>
            <CardContent>
              <AddMovieForm />
            </CardContent>
          </Card>
        </div>
      )}
      {isMobile && (
        <div className="h-svh flex felx-row items-center justify-center px-2 pt-40 mb-48 ">
          <Card className="w-full bg-zinc-800 text-white mt-20 border-none md:border-solid">
            <CardHeader>
              <p className="text-2xl font-semibold text-center ">Add Movie</p>
            </CardHeader>
            <CardContent>
              <AddMovieForm />
            </CardContent>
          </Card>
        </div>
      )}
      <Footer />
    </>
  );
}
