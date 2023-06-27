"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

import { cx } from "~/lib/utils";
import { DesktopSidebar } from "./desktop-sidebar";

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

type LayoutProps = {
	children: React.ReactNode;
};

function Layout({ children }: LayoutProps) {
	return (
		<>
			<DesktopSidebar />
			<main className="py-6 lg:pl-72">
				<div className="relative isolate flex h-full flex-col  px-4 sm:px-6 lg:px-8">
					<BackgroundGradients.GradientTop />
					<div className="mx-auto w-full max-w-screen-2xl rounded-md bg-white/80 p-10 shadow backdrop-blur-2xl">
						{children}
					</div>
					<BackgroundGradients.GradientBottom />
				</div>
			</main>
		</>
	);
}

function LayoutHeader({ children }: LayoutProps) {
	return <div className="flex shrink-0 flex-col pb-6">{children}</div>;
}

function LayoutNavigation() {
	const router = useRouter();
	const pathname = usePathname();

	const pathnameArray = pathname.split("/").filter((path) => path !== "");

	return (
		<div className="mb-2">
			<nav className="sm:hidden" aria-label="Back">
				<button
					onClick={() => router.back()}
					className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
				>
					<ChevronLeftIcon className="-ml-1 mr-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
					<span>Back</span>
				</button>
			</nav>

			<nav className="hidden sm:flex" aria-label="Breadcrumb">
				<ol role="list" className="flex items-center space-x-1">
					<li>
						<div className="flex">
							<Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
								Dashboard
							</Link>
						</div>
					</li>
					{pathnameArray.map((path, index) => {
						const pathToThisPoint = `/${pathnameArray.slice(0, index + 1).join("/")}`;

						return (
							<li key={`${path}-${index}`}>
								<div className="flex items-center">
									<ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
									<Link
										href={pathToThisPoint}
										className={cx(
											"ml-1 text-sm font-medium capitalize text-gray-500 hover:text-gray-700",
											pathToThisPoint === pathname && "font-bold",
										)}
									>
										{path}
									</Link>
								</div>
							</li>
						);
					})}
				</ol>
			</nav>
		</div>
	);
}

function LayoutTitle({ children }: LayoutProps) {
	return (
		<h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">{children}</h1>
	);
}

function LayoutContent({ children }: LayoutProps) {
	return <div className="grow  space-y-10 ">{children}</div>;
}

export { Layout, LayoutHeader, LayoutNavigation, LayoutTitle, LayoutContent };
