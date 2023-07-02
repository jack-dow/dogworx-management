import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { TailwindIndicator } from "~/components/ui/tailwind-indicator";
import { Toaster } from "~/components/ui/toaster";
import { cn } from "~/lib/utils";

// If loading a variable font, you don't need to specify the font weight
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning className="h-full">
				<body
					className={cn(
						"min-h-full font-sans antialiased  flex flex-col text-gray-600",
						fontSans.variable,
						true ? "bg-gray-50" : "bg-gray-950",
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
