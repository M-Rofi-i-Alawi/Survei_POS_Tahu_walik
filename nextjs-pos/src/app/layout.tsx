import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Cemil.in - Pos Tahu Walik",
  description: "Sistem POS (Point of Sale) untuk usaha Tahu Walik milik Ishaq Abdul Zafar. Dibangun dengan Next.js dan Supabase.",
  keywords: ["POS", "Tahu Walik", "Kasir", "Cemil.in"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { borderRadius: "12px" },
          }}
        />
      </body>
    </html>
  );
}
