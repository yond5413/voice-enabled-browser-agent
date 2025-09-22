import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Project Aria - Voice Browser Agent',
  description: 'A voice-controlled browser automation agent powered by Deepgram, OpenRouter, and Stagehand',
  keywords: ['voice control', 'browser automation', 'AI agent', 'speech-to-text'],
  authors: [{ name: 'Project Aria Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {children}
        </div>
      </body>
    </html>
  )
}
