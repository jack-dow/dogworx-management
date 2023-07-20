import "~/styles/globals.css";
import "~/styles/prosemirror.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";

import { TailwindIndicator } from "~/components/ui/tailwind-indicator";
import { Toaster } from "~/components/ui/toaster";
import { authOptions } from "~/lib/auth-options";
import { cn } from "~/lib/utils";
import { NextAuthSessionProvider } from "./providers";

export const metadata: Metadata = {
	title: "Dogworx Management",
};

// If loading a variable font, you don't need to specify the font weight
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

async function RootLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);
	return (
		<html lang="en" suppressHydrationWarning className="h-full">
			<NextAuthSessionProvider>
				<body
					className={cn(
						"min-h-full font-sans antialiased  flex flex-col text-slate-600",
						fontSans.variable,
						session ? "bg-slate-950" : "bg-white",
					)}
				>
					{children}
					<TailwindIndicator />
					<Toaster />
				</body>
			</NextAuthSessionProvider>
		</html>
	);
}

export default RootLayout;
