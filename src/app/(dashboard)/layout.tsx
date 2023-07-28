import { DarkDesktopSidebar } from "~/components/dark-desktop-sidebar";
// import { DarkDesktopSidebar } from "~/components/dark-desktop-sidebar";
import { DesktopSidebar } from "~/components/desktop-sidebar";
import { MobileNavigation } from "~/components/mobile-navigation";
import { actions } from "~/actions";
import { cn } from "~/lib/utils";
import { SessionProvider } from "./providers";

const BackgroundGradients = {
	GradientTop() {
		return (
			<div className="fixed inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
				<div
					className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#FF80B5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>
		);
	},

	GradientBottom() {
		return (
			<div className="fixed inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
				<div
					className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>
		);
	},
};

interface DashboardLayoutProps {
	children: React.ReactNode;
}

async function DashboardLayout({ children }: DashboardLayoutProps) {
	const session = await actions.auth.sessions.current();
	const prefersDarkMode = true;

	return (
		<SessionProvider session={session}>
			<div className={cn(prefersDarkMode ? "bg-slate-900" : "bg-white")}>
				<MobileNavigation />
				{prefersDarkMode ? <DarkDesktopSidebar /> : <DesktopSidebar />}
				<main className="lg:pl-72 2xl:pl-80">
					<div
						className={cn(
							"relative isolate flex h-full flex-col",
							prefersDarkMode
								? "flex-1 flex-col lg:rounded-tl-[2rem] bg-background p-6 lg:p-10"
								: " sm:p-4 md:p-6 lg:px-8",
						)}
					>
						{!prefersDarkMode && <BackgroundGradients.GradientTop />}
						<div
							className={cn(
								"mx-auto w-full max-w-screen-2xl min-h-screen rounded-md  ",
								prefersDarkMode
									? "bg-white"
									: "bg-white/80 py-6 px-4 sm:px-6 sm:py-8 md:px-8 lg:p-10 shadow backdrop-blur-3xl",
							)}
						>
							{children}
						</div>
						{!prefersDarkMode && <BackgroundGradients.GradientBottom />}
					</div>
				</main>
			</div>
		</SessionProvider>
	);
}

export default DashboardLayout;
