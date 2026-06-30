"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/auth/AuthModal";

export default function LoginPage() {
  const router = useRouter();
  const [closed, setClosed] = useState(false);

  if (closed) {
    // User dismissed without logging in — send them to landing
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b" }}>
      <AuthModal
        initialMode="login"
        onClose={() => {
          setClosed(true);
          router.replace("/");
        }}
      />
    </div>
  );
}
