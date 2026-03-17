import Image from "next/image";

interface HeaderProps {
  label: string;
  description: string;
}

export function Header({ label, description }: HeaderProps) {
  return (
    <div className="mt-4 flex w-full flex-col items-center justify-center bg-background text-center">
      <Image src="/logo-mark.svg" alt="Content AI" width={80} height={80} className="h-auto w-16" />
      <h3 className="mt-4 text-2xl font-medium">{label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
