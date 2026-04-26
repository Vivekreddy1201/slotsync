"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginState } = useAuth();
  
  const isRegistered = searchParams.get("registered") === "true";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ username: email, password });
      loginState(data.access_token, data.refresh_token, { id: 0, username: email, email: email }); // stub
      router.push("/");
    } catch (err: any) {
      const msg = err.message || "Failed to login";
      if (msg.includes("Incorrect email/username or password")) {
         setError("Email not found or incorrect password.");
      } else {
         setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 dark:bg-[#1C1C1C] dark:border-zinc-800">
      <div>
        <div className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-xl mx-auto mb-6 dark:bg-white dark:text-black">
          S
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Or{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-500 underline">
            create a new account
          </Link>
        </p>
      </div>

      {isRegistered && !error && (
        <div className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-md text-sm text-center border border-green-200 dark:border-green-900/30">
          Account created successfully! Please sign in.
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="-space-y-px rounded-md shadow-sm">
          <div>
            <input
              name="email"
              type="email"
              required
              className="relative block w-full rounded-t-md border-0 py-2.5 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-[#111] dark:text-white dark:ring-zinc-700"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              required
              className="relative block w-full rounded-b-md border-0 py-2.5 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-[#111] dark:text-white dark:ring-zinc-700"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-md">{error}</div>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#111]">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-zinc-900 dark:bg-[#0a0a0a] text-white p-12 border-r border-zinc-800">
        <div className="text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-black font-bold text-3xl mx-auto mb-8 shadow-xl">
            S
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">SlotSync</h1>
          <p className="text-lg text-zinc-400">
            Welcome back! Manage your schedule and view upcoming bookings.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center text-zinc-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
