"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Header } from "@/components/auth/header";
import { Social } from "@/components/auth/social";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  description: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
  showHeader?: boolean;
}

export function CardWrapper({
  children,
  headerLabel,
  description,
  backButtonLabel,
  backButtonHref,
  showSocial = true,
  showHeader = true,
}: CardWrapperProps) {
  return (
    <Card className="z-50 w-full max-w-[450px] overflow-hidden border-0 shadow-none md:border md:shadow-lg md:outline-8 md:outline-muted">
      <CardHeader>
        {showHeader && <Header label={headerLabel} description={description} />}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {showSocial && (
        <CardFooter>
          <Social />
        </CardFooter>
      )}
      <CardFooter className="md:border-t md:bg-muted md:py-2">
        <BackButton label={backButtonLabel} href={backButtonHref} />
      </CardFooter>
    </Card>
  );
}
