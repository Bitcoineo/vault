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
        <defs>
          <linearGradient id="gem-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Diamond outer shape */}
        <polygon
          points="16,2 28,12 24,30 8,30 4,12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Crown facet line */}
        <polyline
          points="4,12 16,8 28,12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Inner facet lines */}
        <line x1="16" y1="8" x2="8" y2="30" stroke="currentColor" strokeWidth="1.2" />
        <line x1="16" y1="8" x2="24" y2="30" stroke="currentColor" strokeWidth="1.2" />
        {/* Top facet fill for depth */}
        <polygon
          points="4,12 16,8 16,2"
          fill="url(#gem-grad)"
          opacity="0.3"
        />
        <polygon
          points="28,12 16,8 16,2"
          fill="url(#gem-grad)"
          opacity="0.15"
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
