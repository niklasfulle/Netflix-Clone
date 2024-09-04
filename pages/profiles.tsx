import ProfilModal from "@/components/ProfilModal";
import Input from "@/components/Input";
import useProfilModal from "@/hooks/useProfilModal";
import useProfil from "@/hooks/useProfil";
import { NextPageContext } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import axios from "axios";
import { FaArrowLeft, FaPen, FaPlus, FaRegSave } from "react-icons/fa";
import { useState } from "react";

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

const Profiles = () => {
  const router = useRouter();
  const [profileState, setProfileState] = useState("profiles");
  let { data: profiles } = useProfil();
  const [profilImg, setProfilImg] = useState("Frog.png");
  const [profilName, setProfilName] = useState("");
  const { isOpen, openModal, closeModal } = useProfilModal();

  let size = 0;
  if (profiles) {
    size = profiles.length;
  }

  async function save(profilName: string) {
    try {
      await axios.post("/api/profil", {
        profilName,
        profilImg,
      });

      router.reload();
    } catch (error) {
      console.log(error);
    }
  }

  async function useProfile(profilId: string) {
    try {
      await axios.put("/api/profilUse", {
        profilId,
      });

      router.push("/");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <ProfilModal
        visible={isOpen}
        onClose={closeModal}
        setProfilImg={setProfilImg}
        ProfilImg={profilImg}
      />
      <div className="flex items-center justify-center h-full -mt-32">
        <div className="flex flex-col">
          {size != 0 && profileState == "profiles" && (
            <>
              <h1 className="text-3xl text-center text-white md:text-6xl">
                Who is watching?
              </h1>
              <div className="flex items-center justify-center gap-8 mt-10">
                {profiles.map((profil: any) => (
                  <div
                    key={profil.id}
                    onClick={() => {
                      router.push("/");
                    }}
                  >
                    <div className="flex-row mx-auto group w-44">
                      <div
                        onClick={() => useProfile(profil.id)}
                        className="relative flex items-center justify-center overflow-hidden border-2 border-transparent rounded-md w-44 h-44 group-hover:cursor-pointer group-hover:border-white"
                      >
                        <img
                          src={`/images/profil/${profil.image}`}
                          alt="Profile"
                        />
                        <FaPen
                          className="absolute z-10 transition-all ease-in right-2 top-2"
                          size={20}
                        />
                      </div>
                      <div className="mt-4 text-2xl text-center text-gray-400 group-hover:text-white">
                        {profil.name}
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
                        <img src={`/images/profil/${profilImg}`} alt="Profil" />
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
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 -mt-12 transition rounded-full cursor-pointer ">
                  <FaRegSave
                    onClick={() => {
                      save(profilName);
                    }}
                    className="text-white transition-all ease-in hover:text-neutral-300"
                    size={35}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Profiles;
