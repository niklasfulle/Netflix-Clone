"use client";

import { Header } from '@/components/auth/header';
import { Social } from '@/components/auth/social';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

import { BackButton } from './back-button';

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
}: CardWrapperProps) => {
  return (
    <Card className="w-[400px] shadow-md z-100 border-0 bg-black/70">
      <CardHeader>
        <Header label={headerLabel} />
      </CardHeader>
      <CardContent className="">{children}</CardContent>
      {showSocial && (
        <CardFooter>
          <Social />
        </CardFooter>
      )}
      <CardFooter>
        <BackButton href={backButtonHref} label={backButtonLabel} />
      </CardFooter>
    </Card>
  );
};
