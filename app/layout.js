import './globals.css'
export const metadata = {
  title: 'TopSpeed Invoice & Reminder',
  description: 'Invoice and reminder app',
  manifest: '/manifest.webmanifest',
  icons: {
  apple: '/icon-192.png',
  icon: '/icon-192.png'
},
appleWebApp: {
    capable: true,
    title: 'Topspeed Invoice',
    statusBarStyle: 'default'
  }
}
export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}
