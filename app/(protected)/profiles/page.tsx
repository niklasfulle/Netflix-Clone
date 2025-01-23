"use client";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SetStateAction, useState } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaPen, FaPlus, FaRegSave, FaRegTrashAlt } from 'react-icons/fa';

import { remove } from '@/actions/profil/remove';
import { save } from '@/actions/profil/save';
import { update } from '@/actions/profil/update';
import { use } from '@/actions/profil/use';
import Footer from '@/components/Footer';
import Input from '@/components/Input';
import ProfilModal from '@/components/ProfilModal';
import getProfils from '@/hooks/getProfils';
import useProfilModal from '@/hooks/useProfilModal';
import { Profil } from '@prisma/client';

const ProfilesPage = () => {
  const router = useRouter();
  const profiles = getProfils().data;
  const [profileState, setProfileState] = useState<string>("profiles");
  const [profileStateEdit, setProfileStateEdit] = useState<Profil | null>(null);
  const [profilImg, setProfilImg] = useState<string>("Frog.png");
  const [profilName, setProfilName] = useState<string>("");
  const { isOpen, openModal, closeModal } = useProfilModal();

  let size = 0;
  if (profiles) {
    size = profiles.length;
  }

  const saveProfil = async (profilName: string) => {
    save({ profilName, profilImg })
      .then((data) => {
        if (data?.error) {
          toast.error(data?.error);
        }

        if (data?.success) {
          toast.success(data?.success);
          location.reload();
        }
      })
      .catch(() => toast.error("Something went wrong!"));
  };

  const updateProfil = async (profilId: string, profilName: string) => {
    update({ profilId, profilName, profilImg })
      .then((data) => {
        if (data?.error) {
          toast.error(data?.error);
        }

        if (data?.success) {
          toast.success(data?.success);
          location.reload();
        }
      })
      .catch(() => toast.error("Something went wrong!"));
  };

  const removeProfil = async (profilId: string) => {
    remove({ profilId })
      .then((data) => {
        if (data?.error) {
          toast.error(data?.error);
        }

        if (data?.success) {
          toast.success(data?.success);
          location.reload();
        }
      })
      .catch(() => toast.error("Something went wrong!"));
  };

  const profileUse = async (profilId: string) => {
    use({ profilId })
      .then((data) => {
        if (data?.error) {
          toast.error(data?.error);
        }

        if (data?.success) {
          toast.success(data?.success);
          router.push("/");
        }
      })
      .catch(() => toast.error("Something went wrong!"));
  };

  return (
    <>
      <ProfilModal
        visible={isOpen}
        onClose={closeModal}
        setProfilImg={setProfilImg}
        ProfilImg={profilImg}
      />
      <div className="flex items-center justify-center h-svh -mt-20 mb-11">
        <div className="flex flex-col">
          {size != 0 && profileState == "profiles" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                Who is watching?
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                {profiles.map((profil: Profil) => (
                  <div key={profil.id}>
                    <div className="flex-row mx-auto group w-44">
                      <button
                        onClick={() => {
                          if (profil) {
                            profileUse(profil.id);
                          }
                        }}
                        className="relative flex items-center justify-center overflow-hidden border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white"
                      >
                        <Image
                          src={`/images/profil/${profil.image}`}
                          alt="Profile"
                          width={320}
                          height={320}
                        />
                      </button>
                      <div className="flex flex-row items-center justify-center gap-4">
                        <div className="mt-4 text-2xl text-center text-gray-400 group-hover:text-white">
                          {profil.name}
                        </div>
                        <FaPen
                          onClick={() => {
                            setProfileStateEdit(profil);
                            setProfileState("edit");
                            setProfilName(profil.name);
                            setProfilImg(profil.image as string);
                          }}
                          className="z-10 mt-4 text-white transition-all ease-in cursor-pointer hover:text-neutral-500"
                          size={20}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {size < 4 && (
                  <button
                    onClick={() => {
                      setProfileState("add");
                    }}
                    className="flex items-center justify-center w-12 h-12 -mt-12 transition delay-200 border-2 border-white rounded-full cursor-pointer hover:border-neutral-300"
                  >
                    <FaPlus className="text-white" size={25} />
                  </button>
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
                <button
                  onClick={() => {
                    setProfileState("add");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition-all ease-in delay-200 border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300"
                >
                  <FaPlus
                    className="text-white hover:text-neutral-300"
                    size={25}
                  />
                </button>
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
                <button
                  onClick={() => {
                    setProfileState("profiles");
                    setProfilName("");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300"
                >
                  <FaArrowLeft
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={25}
                  />
                </button>
                <div>
                  <div className="flex-row mx-auto text-white transition-all ease-in group w-44 hover:text-neutral-400">
                    <div className="flex items-center justify-center overflow-hidden transition-all ease-in border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white">
                      <button
                        className="relative"
                        onClick={() => openModal("")}
                      >
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
                      </button>
                    </div>
                    <div className="w-56 mt-4 -ml-6 text-2xl text-center text-gray-400 group-hover:text-white">
                      <Input
                        id="profilName"
                        lable="Name"
                        type="text"
                        value={profilName}
                        onChange={(event: {
                          target: { value: SetStateAction<string> };
                        }) => {
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
            </>
          )}
          {profileState == "edit" && profileStateEdit != null && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                Add Profile
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                <button
                  onClick={() => {
                    setProfileState("profiles");
                    setProfilName("");
                    setProfilImg("Frog.png");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300"
                >
                  <FaArrowLeft
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={25}
                  />
                </button>
                <div>
                  <div className="flex-row mx-auto text-white transition-all ease-in group w-44 hover:text-neutral-400">
                    <div className="flex items-center justify-center overflow-hidden transition-all ease-in border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white">
                      <button
                        className="relative"
                        onClick={() => openModal("")}
                      >
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
                      </button>
                    </div>
                    <div className="w-56 mt-4 -ml-6 text-2xl text-center text-gray-400 group-hover:text-white">
                      <Input
                        id="profilName"
                        lable="Name"
                        type="text"
                        value={profilName}
                        onChange={(event: {
                          target: { value: SetStateAction<string> };
                        }) => {
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
                      if (profileStateEdit) {
                        updateProfil(profileStateEdit.id, profilName);
                      }
                    }}
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={35}
                  />
                  <FaRegTrashAlt
                    onClick={() => {
                      if (profileStateEdit) {
                        removeProfil(profileStateEdit?.id);
                      }
                    }}
                    className="text-red-600 transition-all ease-in hover:text-red-500"
                    size={35}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfilesPage;
