"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";

export default function SignupPage() {
  const router = useRouter();
  const [closed, setClosed] = useState(false);

  if (closed) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b" }}>
      <AuthModal
        initialMode="signup"
        onClose={() => {
          setClosed(true);
          router.replace("/");
        }}
      />
    </div>
  );
}
