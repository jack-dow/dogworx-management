import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { auth, ClerkProvider } from "@clerk/nextjs";

import { TailwindIndicator } from "~/components/ui/tailwind-indicator";
import { Toaster } from "~/components/ui/toaster";
import { cn } from "~/lib/utils";

// If loading a variable font, you don't need to specify the font weight
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

function RootLayout({ children }: { children: React.ReactNode }) {
	const { userId } = auth();

	/* cspell:disable-next-line */
	const prefersDarkMode = userId === "user_2RlxcHPACDK9F88joWFyMKrMhkJ";
	return (
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning className="h-full">
				<body
					className={cn(
						"min-h-full font-sans antialiased  flex flex-col text-slate-600",
						fontSans.variable,
						prefersDarkMode ? "bg-slate-950" : "bg-slate-50",
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
