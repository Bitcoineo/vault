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
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M5,3 Q5,1 7,1 L25,1 Q27,1 27,3 L27,15 C27,22 22,27 16,30 C10,27 5,22 5,15 Z M16,9 L10,18 L13,18 L16,13 L19,18 L22,18 Z' fill='%233B82F6' fill-rule='evenodd'/></svg>",
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
