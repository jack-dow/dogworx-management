import "~/styles/globals.css";
import "~/styles/prosemirror.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

import { TailwindIndicator } from "~/components/ui/tailwind-indicator";
import { Toaster } from "~/components/ui/toaster";
import { TooltipProvider } from "~/components/ui/tooltip";
import { getTimezone } from "~/actions/utils";
import { cn } from "~/utils";
import { TimezoneProvider } from "./providers";

export const metadata: Metadata = {
	title: "Dogworx Management",
};

// If loading a variable font, you don't need to specify the font weight
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning className="h-full">
			<TimezoneProvider timezone={getTimezone() ?? "Australia/Brisbane"}>
				<TooltipProvider>
					<body className={cn("min-h-full font-sans antialiased  flex flex-col text-slate-600", fontSans.variable)}>
						{children}
						<TailwindIndicator />
						<Toaster />
					</body>
				</TooltipProvider>
			</TimezoneProvider>
		</html>
	);
}

export default RootLayout;
