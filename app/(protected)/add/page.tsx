"use client";
import Navbar from "@/components/Navbar";
import { AddMovieForm } from "./_components/add-movie-form";

export default function Add() {
  return (
    <>
      <Navbar />
      <div className="flex justify-center h-full pt-44">
        <div className="flex flex-col justify-start">
          <div>
            <h1 className="text-3xl text-center text-white md:text-6xl">
              Add new Movie
            </h1>
            <AddMovieForm />
          </div>
        </div>
      </div>
    </>
  );
}
