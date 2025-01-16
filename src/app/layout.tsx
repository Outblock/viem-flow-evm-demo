import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { type ReactNode } from 'react'



const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'viem-flow-evm-demo',
  description: 'viem-flow-evm-demo',
}

export default function RootLayout(props: { children: ReactNode }) {

  return (
    <html lang="en">
      <body className={inter.className}>
        {props.children}
      </body>
    </html>
  )
}
