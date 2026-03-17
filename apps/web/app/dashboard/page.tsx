"use client";

import { useAuth } from "../../contexts/auth-provider";
import { authClient } from "../../lib/auth-client";

export default function Dashboard() {
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={() => authClient.signOut()}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <p>
            <strong>Email:</strong> {session.user?.email}
          </p>
          <p>
            <strong>Name:</strong> {session.user?.name}
          </p>
          <p>
            <strong>User ID:</strong> {session.user?.id}
          </p>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Protected Content</h2>
          <p>
            This is a protected dashboard page that only authenticated users can
            access.
          </p>
        </div>
      </div>
    </div>
  );
}
