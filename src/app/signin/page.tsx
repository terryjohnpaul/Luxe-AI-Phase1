"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to dashboard
    router.push("/dashboard/command-center");
  }, [router]);

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-white mx-auto mb-4" />
        <p className="text-white/60 text-sm">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
