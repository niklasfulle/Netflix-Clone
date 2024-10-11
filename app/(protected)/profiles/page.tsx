"use client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useRouter as useRouter2 } from "next/compat/router";
import axios from "axios";
import {
  FaArrowLeft,
  FaPen,
  FaPlus,
  FaRegSave,
  FaRegTrashAlt,
} from "react-icons/fa";
import { useState } from "react";
import Image from "next/image";

import Head from "next/head";
import getProfils from "@/hooks/getProfils";
import useProfilModal from "@/hooks/useProfilModal";
import ProfilModal from "@/components/ProfilModal";
import Input from "@/components/Input";
import { save } from "@/actions/profil/save";
import { update } from "@/actions/profil/update";
import { remove } from "@/actions/profil/remove";
import { use } from "@/actions/profil/use";

const ProfilesPage = () => {
  const router = useRouter();
  let profiles = getProfils().data;
  const [profileState, setProfileState] = useState("profiles");
  const [profileStateEdit, setProfileStateEdit] = useState<any>({});
  const [profilImg, setProfilImg] = useState("Frog.png");
  const [profilName, setProfilName] = useState("");
  const { isOpen, openModal, closeModal } = useProfilModal();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  let size = 0;
  if (profiles) {
    size = profiles.length;
  }

  async function saveProfil(profilName: string) {
    save({ profilName, profilImg })
      .then((data) => {
        if (data?.error) {
          setError(data?.error);
        }

        if (data?.success) {
          setSuccess(data?.success);
          location.reload();
        }
      })
      .catch(() => setError("Something went wrong!"));
  }

  async function updateProfil(profilId: string, profilName: string) {
    update({ profilId, profilName, profilImg })
      .then((data) => {
        if (data?.error) {
          setError(data?.error);
        }

        if (data?.success) {
          setSuccess(data?.success);
          location.reload();
        }
      })
      .catch(() => setError("Something went wrong!"));
  }

  async function removeProfil(profilId: string) {
    remove({ profilId })
      .then((data) => {
        if (data?.error) {
          setError(data?.error);
        }

        if (data?.success) {
          setSuccess(data?.success);
          location.reload();
        }
      })
      .catch(() => setError("Something went wrong!"));
  }

  async function useProfile(profilId: string) {
    use({ profilId })
      .then((data) => {
        if (data?.error) {
          setError(data?.error);
        }

        if (data?.success) {
          setSuccess(data?.success);
          router.push("/");
        }
      })
      .catch(() => setError("Something went wrong!"));
  }
  const user = useCurrentUser();
  return (
    <>
      <Head>
        <title>Netflix - Profiles</title>
        <meta property="og:title" content="Netflix - Profiles" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
        <meta name="description" content="Netflix"></meta>
      </Head>
      <ProfilModal
        visible={isOpen}
        onClose={closeModal}
        setProfilImg={setProfilImg}
        ProfilImg={profilImg}
      />
      <div className="flex items-center justify-center h-full pt-40">
        <div className="flex flex-col">
          {size != 0 && profileState == "profiles" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                Who is watching?
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                {profiles.map((profil: any) => (
                  <div key={profil.id}>
                    <div className="flex-row mx-auto group w-44">
                      <div
                        onClick={() => useProfile(profil.id)}
                        className="relative flex items-center justify-center overflow-hidden border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white"
                      >
                        <Image
                          src={`/images/profil/${profil.image}`}
                          alt="Profile"
                          width={320}
                          height={320}
                        />
                      </div>
                      <div className="flex flex-row items-center justify-center gap-4">
                        <div className="mt-4 text-2xl text-center text-gray-400 group-hover:text-white">
                          {profil.name}
                        </div>
                        <FaPen
                          onClick={() => {
                            setProfileStateEdit(profil);
                            setProfileState("edit");
                            setProfilName(profil.name);
                            setProfilImg(profil.image);
                          }}
                          className="z-10 mt-4 text-white transition-all ease-in cursor-pointer hover:text-neutral-500"
                          size={20}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {size < 4 && (
                  <div
                    onClick={() => {
                      setProfileState("add");
                    }}
                    className="flex items-center justify-center w-12 h-12 -mt-12 transition delay-200 border-2 border-white rounded-full cursor-pointer hover:border-neutral-300"
                  >
                    <FaPlus className="text-white" size={25} />
                  </div>
                )}
              </div>
            </>
          )}
          {size == 0 && profileState == "profiles" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                Who is watching?
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                <div
                  onClick={() => {
                    setProfileState("add");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition-all ease-in delay-200 border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300"
                >
                  <FaPlus
                    className="text-white hover:text-neutral-300"
                    size={25}
                  />
                </div>
                <div className="h-44"></div>
              </div>
            </>
          )}
          {profileState == "add" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                Add Profile
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                <div
                  onClick={() => {
                    setProfileState("profiles");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300"
                >
                  <FaArrowLeft
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={25}
                  />
                </div>
                <div>
                  <div className="flex-row mx-auto text-white transition-all ease-in group w-44 hover:text-neutral-400">
                    <div className="flex items-center justify-center overflow-hidden transition-all ease-in border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white">
                      <div className="relative" onClick={() => openModal("")}>
                        <Image
                          src={`/images/profil/${profilImg}`}
                          alt="Profil"
                          width={320}
                          height={320}
                        />
                        <FaPen
                          className="absolute z-10 transition-all ease-in right-2 top-2"
                          size={20}
                        />
                      </div>
                    </div>
                    <div className="w-56 mt-4 -ml-6 text-2xl text-center text-gray-400 group-hover:text-white">
                      <Input
                        id="profilName"
                        lable="Name"
                        type="text"
                        value={profilName}
                        onChange={(event: any) => {
                          setProfilName(event.target.value);
                        }}
                        onKeyDown={null}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 -mt-12 transition rounded-full cursor-pointer ">
                  <FaRegSave
                    onClick={() => {
                      saveProfil(profilName);
                    }}
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={35}
                  />
                </div>
              </div>
              <div
                className={`text-red-600 w-full text-center text-lg font-semibold ${
                  error != "" ? "block" : "hidden"
                }`}
              >
                {error}
              </div>
            </>
          )}
          {profileState == "edit" && profileStateEdit != "" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                Add Profile
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                <div
                  onClick={() => {
                    setProfileState("profiles");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300"
                >
                  <FaArrowLeft
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={25}
                  />
                </div>
                <div>
                  <div className="flex-row mx-auto text-white transition-all ease-in group w-44 hover:text-neutral-400">
                    <div className="flex items-center justify-center overflow-hidden transition-all ease-in border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white">
                      <div className="relative" onClick={() => openModal("")}>
                        <Image
                          src={`/images/profil/${profilImg}`}
                          alt="Profil"
                          width={320}
                          height={320}
                        />
                        <FaPen
                          className="absolute z-10 transition-all ease-in right-2 top-2 "
                          size={20}
                        />
                      </div>
                    </div>
                    <div className="w-56 mt-4 -ml-6 text-2xl text-center text-gray-400 group-hover:text-white">
                      <Input
                        id="profilName"
                        lable="Name"
                        type="text"
                        value={profilName}
                        onChange={(event: any) => {
                          setProfilName(event.target.value);
                        }}
                        onKeyDown={null}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-8 -mt-16 transition rounded-full cursor-pointer ">
                  <FaRegSave
                    onClick={() => {
                      updateProfil(profileStateEdit.id, profilName);
                    }}
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={35}
                  />
                  <FaRegTrashAlt
                    onClick={() => {
                      removeProfil(profileStateEdit.id);
                    }}
                    className="text-red-600 transition-all ease-in hover:text-red-500"
                    size={35}
                  />
                </div>
              </div>
              <div
                className={`text-red-600 w-full text-center text-lg font-semibold ${
                  error != "" ? "block" : "hidden"
                }`}
              >
                {error}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilesPage;
