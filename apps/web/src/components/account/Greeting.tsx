"use client";

import { useAuth } from "@/context/AuthContext";

export function Greeting() {
  const { user } = useAuth();
  const first = user?.name?.split(" ")[0] ?? "traveller";
  return <>Welcome back, {first} 👋</>;
}
