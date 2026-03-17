"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/routes";
import { Button } from "@/components/ui/button";

type Provider = "twitter" | "facebook" | "linkedin" | "pinterest";

const SocialButton = ({ provider, onClick }: { provider: Provider; onClick: () => void }) => (
  <Button size="icon" variant="outline" onClick={onClick} type="button">
    <Image src={`/${provider}.svg`} alt={provider} width={24} height={24} />
  </Button>
);

export function Social() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || DEFAULT_LOGIN_REDIRECT;

  const handleClick = (provider: Provider) => {
    authClient.signIn.social({ provider, callbackURL: callbackUrl });
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">Or continue with</p>
      <div className="flex w-full items-center justify-center gap-4">
        <SocialButton provider="twitter" onClick={() => handleClick("twitter")} />
        <SocialButton provider="facebook" onClick={() => handleClick("facebook")} />
        <SocialButton provider="linkedin" onClick={() => handleClick("linkedin")} />
        <SocialButton provider="pinterest" onClick={() => handleClick("pinterest")} />
      </div>
    </div>
  );
}
