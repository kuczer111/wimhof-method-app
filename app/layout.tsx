export const metadata = {
  title: "Wim Hof Method",
  description: "Wim Hof Method breathing app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
