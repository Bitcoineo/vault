import Link from "next/link";

interface VaultLogoProps {
  size?: number;
  href?: string;
  showText?: boolean;
  textClass?: string;
}

export function VaultLogo({
  size = 28,
  href = "/",
  showText = true,
  textClass = "text-lg font-semibold tracking-tight text-fg-primary",
}: VaultLogoProps) {
  const logo = (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className="text-accent"
      >
        {/* Rounded container / vault body */}
        <rect
          x="4"
          y="8"
          width="24"
          height="20"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Upward arrow — upload/emerge from vault */}
        <path
          d="M16 20V6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M11 10l5-5 5 5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && <span className={textClass}>Vault</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center no-underline">
        {logo}
      </Link>
    );
  }

  return logo;
}
