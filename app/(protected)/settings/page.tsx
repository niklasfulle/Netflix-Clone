"use client";
import Navbar from "@/components/Navbar";
import InfoModal from "@/components/InfoModal";
import useInfoModal from "@/hooks/useInfoModal";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { isEmpty } from "lodash";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsSchema } from "@/schemas";
import { useTransition, useState } from "react";
import { settings } from "@/actions/settings";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { UserRole } from "@prisma/client";

export default function SeriesPage() {
  const user = useSession();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: user.data?.user.name || undefined,
      email: user.data?.user.email || undefined,
      password: undefined,
      newPassword: undefined,
      role: user.data?.user.role || undefined,
      isTwoFactorEnabled: user.data?.user.isTwoFactorEnabled,
    },
  });

  const onSubmit = (valuse: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(valuse)
        .then((data) => {
          if (data?.error) {
            setError(data?.error);
          }

          if (data?.success) {
            update();
            setSuccess(data?.success);
            setError(undefined);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };
  const { data: profil } = useCurrentProfil();
  const { isOpen, closeModal } = useInfoModal();
  const router = useRouter();

  if (profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  return (
    <>
      <InfoModal visible={isOpen} onClose={closeModal} />
      <Navbar />
      <div className="h-svh flex felx-row items-center justify-center px-2">
        <Card className="w-[600px] bg-zinc-900 text-white mt-10">
          <CardHeader>
            <p className="text-2xl font-semibold text-center ">Settings</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="John Doe"
                            type="text"
                            readOnly
                            className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {user.data?.user.isOAuth === false && (
                    <>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="john.doe@example.com"
                                type="email"
                                readOnly
                                className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="******"
                                type="password"
                                className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="******"
                                type="password"
                                className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {user.data?.user.role == UserRole.ADMIN && (
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            disabled={isPending}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500">
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={UserRole.ADMIN}>
                                Admin
                              </SelectItem>
                              <SelectItem value={UserRole.USER}>
                                User
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {user.data?.user.isOAuth === false && (
                    <>
                      <FormField
                        control={form.control}
                        name="isTwoFactorEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm text-white bg-zinc-800 placeholder:text-gray-300 pt-2 border-gray-500">
                            <div className="space-y-0.5">
                              <FormLabel>Two Factor Authentication</FormLabel>
                              <FormDescription className="text-blue-300">
                                Enable two factor authentication for your
                                account
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                disabled={isPending}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
                <FormError message={error} />
                <FormSuccess message={success} />
                <div className="w-full flex flex-row justify-center px-32">
                  <Button
                    disabled={isPending}
                    variant="auth"
                    size="lg"
                    className="max-w-24"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
