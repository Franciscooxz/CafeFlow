import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'CafeFlow — POS para Cafeterías',
  description: 'Sistema de punto de venta moderno para cafeterías',
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#C4704A',
  width: 'device-width',
  initialScale: 1,
};

// Corre antes del primer pintado: aplica la marca y el modo oscuro guardados por
// brand.store y theme.store (formato de zustand/persist: { state, version }).
const themeBootstrap = `(function(){try{
var r=document.documentElement;
var b=JSON.parse(localStorage.getItem('cafeflow-brand')||'null');
var v=b&&b.state&&b.state.vars;
if(v){for(var k in v){if(/^--cafe-[A-Za-z0-9]+$/.test(k)&&/^[0-9 ]+$/.test(v[k]))r.style.setProperty(k,v[k]);}}
var t=JSON.parse(localStorage.getItem('cafeflow-theme')||'null');
if(t&&t.state&&t.state.isDark)r.classList.add('dark');
}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
