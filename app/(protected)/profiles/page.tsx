"use client";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SetStateAction, useState } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaPen, FaPlus, FaRegSave, FaRegTrashAlt, FaSignOutAlt } from 'react-icons/fa';

import { remove } from '@/actions/profil/remove';
import { save } from '@/actions/profil/save';
import { update } from '@/actions/profil/update';
import { use as useProfil } from '@/actions/profil/use';
import Footer from '@/components/Footer';
import Input from '@/components/Input';
import ProfilModal from '@/components/ProfilModal';
import { LogoutButton } from '@/components/auth/logout-button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import getProfils from '@/hooks/getProfils';
import useProfilModal from '@/hooks/useProfilModal';
import type { ProfileDto } from '@/lib/api-types';

const ProfilesPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const profiles = getProfils().data;
  const [profileState, setProfileState] = useState<string>("profiles");
  const [profileStateEdit, setProfileStateEdit] = useState<ProfileDto | null>(null);
  const [profilImg, setProfilImg] = useState<string>("Frog.png");
  const [profilName, setProfilName] = useState<string>("");
  const { isOpen, openModal, closeModal } = useProfilModal();
  const _useProfilAction = useProfil;

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
    _useProfilAction({ profilId })
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
      <LogoutButton
        aria-label={t('Logout')}
        className="fixed right-4 top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-8 md:top-8"
      >
        <FaSignOutAlt aria-hidden="true" />
        <span>{t('Logout')}</span>
      </LogoutButton>
      <div className="flex items-center justify-center h-svh -mt-20 mb-11">
        <div className="flex flex-col">
          {size !== 0 && profileState === "profiles" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                {t('Who is watching?')}
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                {profiles?.map((profil) => (
                  <div key={profil.id}>
                    <div className="flex-row mx-auto group w-44">
                      <button
                        type="button"
                        aria-label={`${t('Select profile')} ${profil.name ?? ''}`.trim()}
                        onClick={() => {
                          if (profil) {
                            profileUse(profil.id);
                          }
                        }}
                        className="relative flex items-center justify-center overflow-hidden border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white focus-visible:border-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                      >
                        <Image
                          src={`/images/profil/${profil.image ?? 'placeholder.png'}`}
                          alt={profil.name ?? t('Profile')}
                          width={320}
                          height={320}
                        />
                      </button>
                      <div className="flex flex-row items-center justify-center gap-4">
                        <div className="mt-4 text-2xl text-center text-gray-400 group-hover:text-white">
                          {profil.name}
                        </div>
                        <button
                          type="button"
                          aria-label={`${t('Edit profile')} ${profil.name ?? ''}`.trim()}
                          onClick={() => {
                            setProfileStateEdit(profil);
                            setProfileState("edit");
                            setProfilName(profil.name ?? "");
                            setProfilImg(profil.image ?? "placeholder.png");
                          }}
                          className="z-10 mt-4 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <FaPen className="cursor-pointer" aria-hidden="true" size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {size < 4 && (
                  <button
                    type="button"
                    aria-label={t('Add Profile')}
                    onClick={() => {
                      setProfileState("add");
                    }}
                    className="flex items-center justify-center w-12 h-12 -mt-12 transition delay-200 border-2 border-white rounded-full cursor-pointer hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                  >
                    <FaPlus className="text-white" size={25} />
                  </button>
                )}
              </div>
            </>
          )}
          {size === 0 && profileState === "profiles" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                {t('Who is watching?')}
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                <button
                  type="button"
                  aria-label={t('Add Profile')}
                  onClick={() => {
                    setProfileState("add");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition-all ease-in delay-200 border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
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
          {profileState === "add" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                {t('Add Profile')}
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                <button
                  type="button"
                  aria-label={t('Back to profiles')}
                  onClick={() => {
                    setProfileState("profiles");
                    setProfilName("");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
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
                        type="button"
                        aria-label={t('Choose profile image')}
                        className="relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                        onClick={() => openModal("")}
                      >
                        <Image
                          src={`/images/profil/${profilImg}`}
                          alt=""
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
                <button
                  type="button"
                  aria-label={t('Save profile')}
                  onClick={() => saveProfil(profilName)}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition rounded-full cursor-pointer hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                >
                  <FaRegSave
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    aria-hidden="true"
                    size={35}
                  />
                </button>
              </div>
            </>
          )}
          {profileState === "edit" && profileStateEdit !== null && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                {t('Add Profile')}
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                <button
                  type="button"
                  aria-label={t('Back to profiles')}
                  onClick={() => {
                    setProfileState("profiles");
                    setProfilName("");
                    setProfilImg("Frog.png");
                  }}
                  className="flex items-center justify-center w-12 h-12 -mt-12 transition border-2 border-white rounded-full cursor-pointer group hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
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
                        type="button"
                        aria-label={t('Choose profile image')}
                        className="relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                        onClick={() => openModal("")}
                      >
                        <Image
                          src={`/images/profil/${profilImg}`}
                          alt=""
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
                <div className="flex flex-col items-center justify-center gap-8 -mt-16 transition rounded-full">
                  <button
                    type="button"
                    aria-label={t('Save profile')}
                    onClick={() => {
                      if (profileStateEdit) {
                        updateProfil(profileStateEdit.id, profilName);
                      }
                    }}
                    className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                  >
                    <FaRegSave className="cursor-pointer text-white" aria-hidden="true" size={35} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('Delete profile')}
                    onClick={() => {
                      if (profileStateEdit) {
                        removeProfil(profileStateEdit?.id);
                      }
                    }}
                    className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-600/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/70"
                  >
                    <FaRegTrashAlt className="cursor-pointer text-red-600" aria-hidden="true" size={35} />
                  </button>
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
