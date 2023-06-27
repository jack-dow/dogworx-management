import "~/styles/globals.css";

import { Inter } from "next/font/google";

import { TailwindIndicator } from "~/components/ui/tailwind-indicator";
import { Toaster } from "~/components/ui/toaster";
import { cx } from "~/lib/utils";

// If loading a variable font, you don't need to specify the font weight
const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={cx("min-h-screen font-sans antialiased bg-gray-50", fontSans.variable)}>
				<div className="relative flex min-h-screen flex-col">
					<div className="flex-1">{children}</div>
					<TailwindIndicator />
				</div>
				<Toaster />
			</body>
		</html>
	);
}
