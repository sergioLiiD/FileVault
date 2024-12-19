import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  )
} 