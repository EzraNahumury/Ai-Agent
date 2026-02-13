import './globals.css';
import { Space_Grotesk, Fraunces } from 'next/font/google';

const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-serif' });

export const metadata = {
  title: 'x402 Stacks Agent',
  description: 'Autonomous agent that pays for premium resources via HTTP 402'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${space.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
