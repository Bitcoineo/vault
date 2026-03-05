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
        className="text-accent"
      >
        {/* Shield with upward arrow cutout — fill-rule evenodd creates negative space */}
        <path
          d="M5,3 Q5,1 7,1 L25,1 Q27,1 27,3 L27,15 C27,22 22,27 16,30 C10,27 5,22 5,15 Z M16,9 L10,18 L13,18 L16,13 L19,18 L22,18 Z"
          fill="currentColor"
          fillRule="evenodd"
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
