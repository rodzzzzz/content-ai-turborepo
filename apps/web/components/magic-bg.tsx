import { cn } from "@/lib/utils";

export default function MagicBg({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-20 -top-20 h-96 w-96 animate-blob rounded-full bg-purple-200 opacity-70 mix-blend-multiply blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 animate-blob rounded-full bg-blue-200 opacity-70 mix-blend-multiply blur-3xl [animation-delay:2s]" />
      <div className="absolute -bottom-20 -left-20 h-96 w-96 animate-blob rounded-full bg-pink-200 opacity-70 mix-blend-multiply blur-3xl [animation-delay:4s]" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 animate-blob rounded-full bg-purple-200 opacity-70 mix-blend-multiply blur-3xl" />
    </div>
  );
}
