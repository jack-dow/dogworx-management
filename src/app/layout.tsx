import "~/styles/globals.css";
import "~/styles/prosemirror.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { auth, ClerkProvider } from "@clerk/nextjs";

import { TailwindIndicator } from "~/components/ui/tailwind-indicator";
import { Toaster } from "~/components/ui/toaster";
import { cn } from "~/lib/utils";

export const metadata: Metadata = {
	title: "Dogworx Management",
};

// If loading a variable font, you don't need to specify the font weight
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

function RootLayout({ children }: { children: React.ReactNode }) {
	const { userId } = auth();

	/* cspell:disable-next-line */
	const prefersDarkMode =
		/* cspell:disable-next-line */
		userId === "user_2RlxcHPACDK9F88joWFyMKrMhkJ" || userId === "user_2SVCNzIdjgowGAubcZM90D2fFCf";
	return (
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning className="h-full">
				<body
					className={cn(
						"min-h-full font-sans antialiased  flex flex-col text-slate-600",
						fontSans.variable,
						prefersDarkMode ? "bg-slate-950" : "bg-white",
					)}
				>
					{children}
					<TailwindIndicator />
					<Toaster />
				</body>
			</html>
		</ClerkProvider>
	);
}

export default RootLayout;
