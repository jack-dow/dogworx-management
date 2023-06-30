import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";

// import { DarkDesktopSidebar } from "~/components/dark-desktop-sidebar";
import { DesktopSidebar } from "~/components/desktop-sidebar";

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

async function DashboardLayout1({ children }: DashboardLayoutProps) {
	const user = await currentUser();

	if (!user) {
		redirect("/sign-in");
	}

	return (
		<>
			<DesktopSidebar />
			<main className="py-6 lg:pl-72 xl:pl-80">
				<div className="relative isolate flex h-full flex-col  px-4 sm:px-6 lg:px-8">
					<BackgroundGradients.GradientTop />
					<div className="mx-auto w-full max-w-screen-2xl rounded-md bg-white/80 p-10 shadow backdrop-blur-3xl">
						{children}
					</div>
					<BackgroundGradients.GradientBottom />
				</div>
			</main>
		</>
	);
}

// async function DashboardLayout2({ children }: DashboardLayoutProps) {
// 	const user = await currentUser();

// 	if (!user) {
// 		redirect("/sign-in");
// 	}

// 	return (
// 		<>
// 			<DarkDesktopSidebar />
// 			<main className="flex h-full flex-1 flex-col  lg:pl-72 xl:pl-80">
// 				<div className="relative isolate flex h-full flex-1 flex-col rounded-tl-[2rem] bg-white p-4 sm:p-6 lg:p-10 ">
// 					<div className="mx-auto w-full max-w-screen-2xl rounded-md bg-white pb-10">{children}</div>
// 				</div>
// 			</main>
// 		</>
// 	);
// }

export default DashboardLayout1;
