import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LlamaIndex UI - Next.js Example',
  description: 'Example usage of LlamaIndex UI components in Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}