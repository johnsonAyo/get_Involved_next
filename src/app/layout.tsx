import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Get Involved | Know Your Candidates",
  description:
    "Search Nigerian candidates by office, party, state, and local government.",
  icons: {
    icon: "/assets/logo/nigeria-1758969_1280_4.png",
  },
};

const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      var theme = stored || "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      data-theme="light"
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
