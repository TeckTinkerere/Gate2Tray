import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";

export const metadata: Metadata = {
  title: "Gate2Tray OS",
  description: "Agentic meal-commerce operations for small charter airlines.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
