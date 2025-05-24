import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DataProvider } from "./context/DataContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TrackMate - Financial Dashboard",
  description: "Track your finances with ease",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  )
}
