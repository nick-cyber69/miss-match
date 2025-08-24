import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Miss Match - AI Virtual Try-On',
  description: 'Upload your photo and try on clothes with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-gray-900">Miss Match</h1>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
