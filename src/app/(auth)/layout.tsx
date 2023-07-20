interface AuthLayoutProps {
	children: React.ReactNode;
}

const BackgroundSVGs = {
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

	GridTop() {
		return (
			<div className="absolute inset-0 text-slate-900/[0.07] [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]">
				<svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<pattern
							id="grid-bg"
							width="32"
							height="32"
							patternUnits="userSpaceOnUse"
							x="100%"
							patternTransform="translate(0 -1)"
						>
							<path d="M0 32V.5H32" fill="none" stroke="currentColor"></path>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#grid-bg)"></rect>
				</svg>
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

function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<main className="relative flex flex-1 flex-col overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
			<div className="relative isolate flex h-full flex-1 flex-col  px-4 sm:px-6 lg:px-8">
				<BackgroundSVGs.GradientTop />
				<BackgroundSVGs.GridTop />
				<div className="relative flex flex-1 flex-col items-center justify-center ">{children}</div>
				<BackgroundSVGs.GradientBottom />
			</div>
		</main>
	);
}

export default AuthLayout;
