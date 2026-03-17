import { CardWrapper } from "@/components/auth/card-wrapper";
import { TriangleAlert } from "lucide-react";

export function ErrorCard({ errorMessage }: { errorMessage: string }) {
  return (
    <CardWrapper
      headerLabel=""
      description=""
      backButtonHref="/auth/login"
      backButtonLabel="Back to login"
      showSocial={false}
      showHeader={false}
    >
      <div className="flex w-full flex-col items-center justify-center gap-1">
        <TriangleAlert className="h-16 w-16 text-destructive" />
        <p className="mt-4 text-center text-lg font-semibold">Oops! Something went wrong!</p>
        <p className="text-center text-sm text-muted-foreground">{errorMessage}</p>
      </div>
    </CardWrapper>
  );
}
