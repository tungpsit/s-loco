import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
})

export const metadata: Metadata = {
  title: 'S-Loco — Pitching website cho nhà đầu tư',
  description:
    'Website giới thiệu S-Loco cho nhà đầu tư: nền tảng thương mại du lịch địa phương khởi đầu tại Sầm Sơn, Việt Nam.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="vi" className={`${geist.variable} ${geistMono.variable} ${beVietnam.variable}`}>
      <body>{children}</body>
    </html>
  )
}
