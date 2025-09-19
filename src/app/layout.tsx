import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { UserSyncWrapper } from "@/components/UserSyncWrapper";
import { FinishedGoodsDataManager } from "@/components/FinishedGoodsDataManager";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventory Dashboard",
  description: "Monitor stock quantities for raw materials and finished goods",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <UserSyncWrapper>
            <FinishedGoodsDataManager>
              {children}
            </FinishedGoodsDataManager>
          </UserSyncWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}