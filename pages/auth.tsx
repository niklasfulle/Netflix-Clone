import Input from "@/components/Input";
import axios from "axios";
import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

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
    <div className="relative h-full w-full bg-[url('/images/hero.jpg')] bg-no-repeat bg-center bg-fixed bg-cover">
      <div className="w-full h-full bg-black lg:bg-opacity-50">
        <nav className="px-12 py-5">
          <img src="/images/logo.png" alt="Logo" className="h-12" />
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
                />
                <Input
                  id="password"
                  lable="Password"
                  type="password"
                  value={password}
                  onChange={(event: any) => {
                    setPassword(event.target.value);
                  }}
                />
              </div>
              <button
                onClick={variant === "login" ? login : register}
                className="w-full py-3 mt-10 font-bold text-white transition bg-red-600 rounded-md hover:bg-red-700"
              >
                {variant === "login" ? "Login" : "Register"}
              </button>
              <div className="flex flex-row items-center justify-center gap-4 mt-8">
                <div
                  onClick={() => signIn("google", { callbackUrl: "/profiles" })}
                  className="flex items-center justify-center w-40 h-10 transition bg-white rounded-full cursor-pointer hover:opacity-80"
                >
                  <FcGoogle size={30} />
                </div>
                <div
                  onClick={() => signIn("github", { callbackUrl: "/profiles" })}
                  className="flex items-center justify-center w-40 h-10 transition bg-white rounded-full cursor-pointer hover:opacity-80"
                >
                  <FaGithub size={30} />
                </div>
              </div>
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
  );
};

export default Auth;
