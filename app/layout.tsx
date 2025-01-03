import './globals.css'

export const metadata = {
  title: 'Unit Optimizer',
  description: 'Optimize your educational units with AI analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 