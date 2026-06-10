import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AW | Obras",
  description: "Gestão de obras Athié Wohnrath",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
