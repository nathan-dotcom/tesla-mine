export const metadata = {
  title: "TeslaMine — Cloud Mining Platform",
  description: "Mine smarter with Tesla surplus energy. Real-time earnings, instant withdrawals.",
  icons: {
    icon: [
      { url: "/favicon-16.png",  sizes: "16x16",   type: "image/png" },
      { url: "/favicon-32.png",  sizes: "32x32",   type: "image/png" },
      { url: "/favicon-48.png",  sizes: "48x48",   type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico",     sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon"             type="image/x-icon" href="/favicon.ico" />
        <link rel="icon"             type="image/png"    sizes="16x16"   href="/favicon-16.png" />
        <link rel="icon"             type="image/png"    sizes="32x32"   href="/favicon-32.png" />
        <link rel="icon"             type="image/png"    sizes="48x48"   href="/favicon-48.png" />
        <link rel="apple-touch-icon" type="image/png"    sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#06090f" }}>
        {children}
      </body>
    </html>
  );
}