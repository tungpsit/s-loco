import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'

const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'S-Loco Sầm Sơn — Tải app du lịch địa phương',
  description:
    'Khám phá Sầm Sơn dễ hơn với S-Loco: tìm điểm đến, ẩm thực, lưu trú, ưu đãi địa phương và lịch trình thông minh ngay trên điện thoại.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={roboto.variable}>
      <body>{children}</body>
    </html>
  )
}
