import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Gard Docs - Presentaciones Comerciales",
  description: "Sistema de presentaciones comerciales inteligente para Gard Security",
  icons: {
    icon: [
      { url: "/icons/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
