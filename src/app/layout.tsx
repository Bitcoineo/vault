import type { Metadata } from "next";
import { Inter, Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Vault — File Upload & Processing",
  description:
    "Upload, organize, and process your files with cloud storage, thumbnails, and PDF text extraction.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><polygon points='16,2 28,12 24,30 8,30 4,12' fill='%233B82F6' stroke='%232563EB' stroke-width='1.5'/><polyline points='4,12 16,8 28,12' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.5'/><line x1='16' y1='8' x2='8' y2='30' stroke='%23ffffff' stroke-width='0.8' opacity='0.3'/><line x1='16' y1='8' x2='24' y2='30' stroke='%23ffffff' stroke-width='0.8' opacity='0.3'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vault-theme');if(t&&['light','dim','dark'].includes(t))document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} ${dmSans.variable} font-[family-name:var(--font-inter)] antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
