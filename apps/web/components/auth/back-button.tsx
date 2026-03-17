"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href: string;
  label: string;
}

export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Button variant="link" className="w-full font-medium text-muted-foreground" size="sm" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
