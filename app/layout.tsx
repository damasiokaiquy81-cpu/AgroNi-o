import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AgroNiño • Inteligência para o seu campo', description: 'Clima, prevenção e mercado para o produtor rural.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html> }
