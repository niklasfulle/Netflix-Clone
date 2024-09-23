import Input from "@/components/Input";
import axios from "axios";
import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { z } from "zod";

const EmailSchema = z.object({
  emailTest: z.string().email("Invalid email"),
});

const Auth = () => {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [variant, setVariant] = useState("login");
  const [error, setError] = useState<string>("");

  const toggleVariant = useCallback(() => {
    setVariant((currentVariant) =>
      currentVariant === "login" ? "register" : "login"
    );
    setError("");
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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (
          typeof result.error === "string" &&
          result.error.charAt(0) === "["
        ) {
          const error: any = JSON.parse(result.error);

          setError(error[0].message);

          if (error[0].message.indexOf("Email and password required") == 0) {
          } else if (error[0].message.indexOf("Invalid email") == 0) {
            setEmailError(true);
            setPasswordError(false);
          } else if (error[0].message.indexOf("Incorrect password") == 0) {
            setPasswordError(true);
            setEmailError(false);
          } else if (error[0].message.indexOf("Email does not exist") == 0) {
            setPasswordError(false);
            setEmailError(true);
          } else if (
            error[0].message.indexOf(
              "Password should be minimum 5 characters"
            ) == 0
          ) {
            setPasswordError(true);
            setEmailError(false);
          }
        } else {
          setError(result.error);

          if (result.error.indexOf("Email and password required") == 0) {
          } else if (result.error.indexOf("Invalid email") == 0) {
            setEmailError(true);
            setPasswordError(false);
          } else if (result.error.indexOf("Incorrect password") == 0) {
            setPasswordError(true);
            setEmailError(false);
          } else if (result.error.indexOf("Email does not exist") == 0) {
            setPasswordError(false);
            setEmailError(true);
          } else if (
            result.error.indexOf("Password should be minimum 5 characters") == 0
          ) {
            setPasswordError(true);
            setEmailError(false);
          }
        }
      } else {
        setError("");
        setPasswordError(false);
        setEmailError(false);
        window.location.href = "/profiles";
      }
    } catch (error) {
      console.log(error);
    }
  }, [email, password]);

  const register = useCallback(async () => {
    try {
      await axios
        .post("/api/register", {
          email,
          name: username,
          password,
          redirect: false,
        })
        .catch(function (error) {
          console.log(error);
        });
    } catch (error) {}
  }, [email, username, password, login]);

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
              <div className="self-center w-full px-16 pt-16 pb-12 mt-2 bg-black rounded-md bg-opacity-70 lg:w-2/5 lg:max-w-md">
                <h2 className="mb-8 text-4xl font-semibold text-white">
                  {variant === "login" ? "Sign in" : "Sign up"}
                </h2>
                <div className="flex flex-col gap-4">
                  {variant === "register" && (
                    <Input
                      id="name"
                      lable="Username"
                      value={username}
                      onChange={(event: any) => {
                        setUsername(event.target.value);
                      }}
                      onKeyDown={null}
                      required={true}
                      error={usernameError}
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
                    required={true}
                    error={emailError}
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
                    required={true}
                    error={passwordError}
                  />
                </div>
                <div
                  className={`text-red-600 pt-5 w-full text-center text-lg font-semibold ${
                    error != "" ? "block" : "hidden"
                  }`}
                >
                  {error}
                </div>
                <button
                  onClick={variant === "login" ? login : register}
                  className="w-full py-3 mt-6 font-bold text-white transition bg-red-600 rounded-md hover:bg-red-700"
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
