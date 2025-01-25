"use client";
import { isEmpty } from 'lodash';
import { useRouter } from 'next/navigation';
import { isMobile } from 'react-device-detect';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import useCurrentProfil from '@/hooks/useCurrentProfil';
import getUser from '@/hooks/useUser';

import { SettingsForm } from './_components/settings-form';

export default function SettingsPage() {
  const user = getUser();

  const { data: profil } = useCurrentProfil();
  const router = useRouter();

  if (user == undefined || profil == undefined) {
    return null;
  }

  if (isEmpty(profil)) {
    router.push("profiles");
  }

  return (
    <>
      <Navbar />
      {!isMobile && (
        <div className="h-svh flex felx-row items-center justify-center px-2">
          <Card className="w-[600px] bg-zinc-800 text-white mt-20 border-none md:border-solid">
            <CardHeader>
              <p className="text-2xl font-semibold text-center ">Settings</p>
            </CardHeader>
            <CardContent>
              <SettingsForm user={user} />
            </CardContent>
          </Card>
        </div>
      )}
      {isMobile && (
        <div className="h-svh flex felx-row items-center justify-center px-2 pt-40 mb-48 ">
          <Card className="w-full bg-zinc-800 text-white mt-20 border-none md:border-solid">
            <CardHeader>
              <p className="text-2xl font-semibold text-center ">Settings</p>
            </CardHeader>
            <CardContent>
              <SettingsForm user={user} />
            </CardContent>
          </Card>
        </div>
      )}
      <Footer />
    </>
  );
}
