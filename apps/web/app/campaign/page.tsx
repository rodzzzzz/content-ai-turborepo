"use client";

import { useAuth } from "@/contexts/auth-provider";
import { LogoutButton } from "@/components/auth/logout-button";

export default function CampaignPage() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Please sign in to access this page
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campaign</h1>
        <LogoutButton />
      </div>
      <p className="text-gray-600">
        Welcome, {session.user?.name ?? session.user?.email}. Campaign features
        will be migrated here.
      </p>
    </div>
  );
}
