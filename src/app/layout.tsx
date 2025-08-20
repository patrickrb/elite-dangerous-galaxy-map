import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elite Dangerous Galaxy Map",
  description: "Interactive 3D galaxy map for Elite Dangerous",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <div id="pointer" style={{ visibility: 'hidden', display: 'none' }}></div>
      </body>
    </html>
  );
}
