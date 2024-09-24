import Navbar from "@/components/Navbar";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import Input from "@/components/Input";
import { useState } from "react";
import axios from "axios";
import Head from "next/head";
import { NextPageContext } from "next";
import { getSession } from "next-auth/react";

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function Add() {
  const { data: profil } = useCurrentProfil();
  const [movieName, setMovieName] = useState("");
  const [movieNameError, setMovieNameError] = useState(false);
  const [movieDescripton, setMovieDescripton] = useState("");
  const [movieDescriptonError, setMovieDescriptonError] = useState(false);
  const [movieActor, setMovieActor] = useState("");
  const [movieActorError, setMovieActorError] = useState(false);
  const [movieType, setMovieType] = useState("");
  const [movieTypeError, setMovieTypeError] = useState(false);
  const [movieGenre, setMovieGenre] = useState("");
  const [movieGenreError, setMovieGenreError] = useState(false);
  const [movieDuration, setMovieDuration] = useState("");
  const [movieDurationError, setMovieDurationError] = useState(false);
  const [movieVideo, setMovieVideo] = useState("");
  const [movieVideoError, setMovieVideoError] = useState(false);
  const [movieThumbnail, setMovieThumbnail] = useState("");
  const [movieThumbnailError, setMovieThumbnailError] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function save() {
    try {
      await axios
        .post("/api/movies/create", {
          title: movieName,
          description: movieDescripton,
          actor: movieActor,
          type: movieType,
          genre: movieGenre,
          duration: movieDuration,
          videoUrl: movieVideo,
          thumbnailUrl: movieThumbnail,
        })
        .catch(function (error) {
          console.log(error);
          setError(error?.response.data.error);

          if (error?.response.data.error == "") {
          }
        });

      //router.reload();
    } catch (error) {
      console.log(error);
    }

    if (profil == undefined) {
      return null;
    }

    if (isEmpty(profil)) {
      router.push("profiles");
    }
  }

  return (
    <>
      <Head>
        <title>Netflix - Add</title>
        <meta property="og:title" content="Netflix - Add" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
        <meta name="description" content="Netflix"></meta>
      </Head>
      <Navbar />
      <div className="flex justify-center h-full pt-44">
        <div className="flex flex-col justify-start">
          <div>
            <h1 className="text-3xl text-center text-white md:text-6xl">
              Add new Movie
            </h1>
            <div className="flex flex-col gap-5 mx-4 mt-8">
              <Input
                lable="Name"
                value={movieName}
                id="MovieName"
                onChange={(event: any) => {
                  setMovieName(event.target.value);
                }}
                onKeyDown={null}
                error={movieNameError}
              />
              <Input
                lable="Descripton"
                value={movieDescripton}
                id="MovieDescripton"
                onChange={(event: any) => {
                  setMovieDescripton(event.target.value);
                }}
                onKeyDown={null}
                error={movieDescriptonError}
              />
              <div className="grid grid-cols-2 gap-5">
                <Input
                  lable="Actor"
                  value={movieActor}
                  id="MovieActor"
                  onChange={(event: any) => {
                    setMovieActor(event.target.value);
                  }}
                  onKeyDown={null}
                  error={movieActorError}
                />
                <Input
                  lable="Type"
                  value={movieType}
                  id="MovieType"
                  onChange={(event: any) => {
                    setMovieType(event.target.value);
                  }}
                  onKeyDown={null}
                  error={movieTypeError}
                />
                <Input
                  lable="Genre"
                  value={movieGenre}
                  id="MovieGenre"
                  onChange={(event: any) => {
                    setMovieGenre(event.target.value);
                  }}
                  onKeyDown={null}
                  error={movieGenreError}
                />
                <Input
                  lable="Duration"
                  value={movieDuration}
                  id="MovieDuration"
                  onChange={(event: any) => {
                    setMovieDuration(event.target.value);
                  }}
                  onKeyDown={null}
                  error={movieDurationError}
                />
              </div>
              <Input
                lable="Video Link"
                value={movieVideo}
                id="MovieVideo"
                onChange={(event: any) => {
                  setMovieVideo(event.target.value);
                }}
                onKeyDown={null}
                error={movieVideoError}
              />
              <Input
                lable="Thumbnail Link"
                value={movieThumbnail}
                id="MovieThumbnail"
                onChange={(event: any) => {
                  setMovieThumbnail(event.target.value);
                }}
                onKeyDown={null}
                error={movieThumbnailError}
              />
              <div className="px-32">
                <button
                  onClick={() => {
                    save();
                  }}
                  className="w-full py-3 mt-10 font-bold text-white transition bg-red-600 rounded-md hover:bg-red-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
