import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Miss Match',
  description: 'Upload your photo and try on clothes with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}