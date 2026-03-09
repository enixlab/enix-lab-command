import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'ENIX LAB® — Command Center',
  description: 'Digital Black Ops Agency — Command Center',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,10 90,80 10,80' fill='%230047FF'/></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[240px] min-h-screen">
            <div className="max-w-[1400px] mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
