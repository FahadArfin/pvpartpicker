import type { Metadata } from "next";
import "./globals.css";
import "./part-comparison.css";
import "./guide.css";
import "./usability.css";
import "./theme.css";
import "./home.css";
import "./mobile.css";
import "./floating-sections.css";
import {themeBootstrap} from '../lib/theme';
import {PVProvider} from '../components/pv-provider';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';

export const metadata: Metadata = {
  title: {default:'PVPartPicker — Build your solar system',template:'%s · PVPartPicker'},
  description: 'Compare solar panels, batteries, inverters, mounting, and electrical parts. Build your system and track real retailer prices.',
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user=await getChatGPTUser();
  return (
    <html lang="en" data-theme="dark" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html:themeBootstrap}}/></head>
      <body><PVProvider user={user?{displayName:user.displayName,email:user.email}:null}>{children}</PVProvider></body>
    </html>
  );
}
