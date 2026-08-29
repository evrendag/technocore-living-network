import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Technocore // Living Network",
  description: "Watch the agent economy become alive.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
