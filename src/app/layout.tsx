import type { Metadata } from 'next';
import './globals.css';

export const metadata:Metadata={title:'Campus Relay · Assessment simulation',description:'An independent growth assessment simulation for a proposed free AI project workshop.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
