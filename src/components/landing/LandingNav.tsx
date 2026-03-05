"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VaultLogo } from "../ui/VaultLogo";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${
        scrolled ? "bg-[#0A0A0F]/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <VaultLogo
          size={24}
          href="/"
          showText
          textClass="font-[family-name:var(--font-outfit)] text-lg font-semibold tracking-tight text-white"
        />

        <div className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="font-[family-name:var(--font-dm-sans)] text-[15px] text-[#8B95A5] transition-colors hover:text-[#E8ECF1]"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-full bg-[#3B82F6] px-5 py-2 font-[family-name:var(--font-dm-sans)] text-sm font-medium text-white transition-all hover:bg-[#2563EB] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
