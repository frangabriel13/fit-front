import type { Metadata, Viewport } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitFront",
  description: "Tu rutina y modo entrenamiento, pensado para el gym.",
  // Sin esto, iOS abre la app agregada a la pantalla de inicio dentro de Safari
  // con toda su barra, y no en pantalla completa como el manifest pide.
  appleWebApp: { capable: true, title: "FitFront", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  // Pinta la barra de estado del celular del color del fondo. Sin esto, en
  // modo standalone queda una franja blanca arriba de una app toda oscura.
  themeColor: "#0a1014",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
