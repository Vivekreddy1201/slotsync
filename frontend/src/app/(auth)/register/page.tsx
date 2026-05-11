"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Explicit validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      await register({ email, username, password });
      router.push("/login?registered=true");
    } catch (err: any) {
      const msg = err.message || "Failed to register";
      setError(msg.includes("Email already registered") ? "This email is already registered." : msg);
    } finally {
      setLoading(false);
    }
  };

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
            The easiest way to manage your schedule, bookings, and share your availability with the world.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 dark:bg-[#1C1C1C] dark:border-zinc-800">
          <div>
            <div className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-xl mx-auto mb-6 dark:bg-white dark:text-black">
              S
            </div>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Create an account
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Or{" "}
              <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500 underline">
                sign in to your account
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
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
                  name="username"
                  type="text"
                  required
                  className="relative block w-full border-0 py-2.5 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-[#111] dark:text-white dark:ring-zinc-700"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="relative block w-full rounded-b-md border-0 py-2.5 px-3 pr-10 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-[#111] dark:text-white dark:ring-zinc-700"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 z-20 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-md">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
