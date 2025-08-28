import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Optimizar Entregas - Optimización de Rutas',
  description: 'Herramienta para optimizar rutas de entrega usando algoritmos TSP avanzados y Google Maps',
  keywords: 'optimización, rutas, entregas, TSP, Google Maps, logística',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="h-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
