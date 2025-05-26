import type React from "react"
import type { Metadata } from "next"
import { Source_Sans_3, Crimson_Text } from "next/font/google"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
})

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-crimson",
})

export const metadata: Metadata = {
  title: "Progress Tracker",
  description: "A minimalist progress tracker for your goals",
  manifest: "/manifest.json",
  themeColor: "#1f2937",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1f2937" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${sourceSans.variable} ${crimsonText.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
