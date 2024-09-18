import Input from "@/components/Input";
import axios from "axios";
import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

const Auth = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [variant, setVariant] = useState("login");

  const toggleVariant = useCallback(() => {
    setVariant((currentVariant) =>
      currentVariant === "login" ? "register" : "login"
    );
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (email != "" && password != "") {
        login();
      }
    }
  };

  const login = useCallback(async () => {
    try {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/profiles",
      });
    } catch (error) {
      console.log(error);
    }
  }, [email, password]);

  const register = useCallback(async () => {
    try {
      await axios.post("/api/register", {
        email,
        name,
        password,
      });

      login();
    } catch (error) {
      console.log(error);
    }
  }, [email, name, password, login]);

  return (
    <>
      <Head>
        <title>Netflix - Login</title>
        <meta property="og:title" content="Netflix - Login" key="title" />
        <link rel="icon" type="image/x-icon" href="nficon2016.ico"></link>
        <meta name="description" content="Netflix"></meta>
      </Head>
      <div className="relative h-full w-full bg-[url('/images/hero.jpg')] bg-no-repeat bg-center bg-fixed bg-cover">
        <div className="w-full h-full bg-black lg:bg-opacity-50">
          <nav className="px-12 py-5">
            <Link href={"/"}>
              <Image
                src="/images/Logo.png"
                alt="Logo"
                className="h-12"
                width={100}
                height={100}
              />
            </Link>
            <div className="flex justify-center">
              <div className="self-center w-full px-16 py-16 mt-2 bg-black rounded-md bg-opacity-70 lg:w-2/5 lg:max-w-md">
                <h2 className="mb-8 text-4xl font-semibold text-white">
                  {variant === "login" ? "Sign in" : "Sign up"}
                </h2>
                <div className="flex flex-col gap-4">
                  {variant === "register" && (
                    <Input
                      id="name"
                      lable="Username"
                      value={name}
                      onChange={(event: any) => {
                        setName(event.target.value);
                      }}
                      onKeyDown={null}
                    />
                  )}
                  <Input
                    id="email"
                    lable="Email"
                    type="email"
                    value={email}
                    onChange={(event: any) => {
                      setEmail(event.target.value);
                    }}
                    onKeyDown={null}
                  />
                  <Input
                    id="password"
                    lable="Password"
                    type="password"
                    value={password}
                    onChange={(event: any) => {
                      setPassword(event.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <button
                  onClick={variant === "login" ? login : register}
                  className="w-full py-3 mt-10 font-bold text-white transition bg-red-600 rounded-md hover:bg-red-700"
                >
                  {variant === "login" ? "Login" : "Register"}
                </button>
                <p className="mt-12 text-neutral-400">
                  {variant === "login"
                    ? "First time using Netflix?"
                    : "Already have an account?"}
                  <span
                    onClick={toggleVariant}
                    className="ml-1 text-white cursor-pointer hover:underline"
                  >
                    {variant === "login" ? "Creat an account" : "Login"}
                  </span>
                </p>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Auth;
