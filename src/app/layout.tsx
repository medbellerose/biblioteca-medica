import './globals.css'

export const metadata = {
  title: 'Medpath - Mi Biblioteca Médica',
  description: 'Apuntes de medicina organizados y protegidos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </head>
      <body>{children}</body>
    </html>
  )
}