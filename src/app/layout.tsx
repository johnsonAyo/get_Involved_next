import type { Metadata } from "next";
/* Direct JS import for election-feed.css. Token / design-system /
 * page stylesheets continue to load via globals.css's @import chain
 * because they shipped cleanly. election-feed.css is imported here
 * so the bundler treats it as a discrete module — this is more
 * reliable than a trailing CSS @import (which was, in this codebase,
 * historically dropped from the emitted bundle when the .next/ cache
 * went stale). Cascade order: election-feed rules apply first; the
 * globals.css resets/typography then layer on top, which is the
 * desired precedence. */
import "../styles/election-feed.css";
import "./globals.css";
import Providers from "./providers";
import { ElectionFeedWidget } from "@/components/election-feed";
import { getGeoStates } from "@/app/actions/polling-units";

export const metadata: Metadata = {
  title: "Get Involved | Know Your Candidates",
  description:
    "Search Nigerian candidates by office, party, state, and local government — and follow live election updates from every polling unit on Election Watch.",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Pre-resolve the canonical states list on the server so the very
  // first paint of the global Election Watch widget has the full
  // 36-state dropdown options ready — no hydration flash, no client
  // round-trip on every navigation.
  const states = await getGeoStates();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      data-theme="light"
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          {children}
          <ElectionFeedWidget states={states} />
        </Providers>
      </body>
    </html>
  );
}
