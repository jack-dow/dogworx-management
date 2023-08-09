import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/utils";

function LoaderIcon({ className }: { className: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	);
}

const loaderVariants = cva("-ml-1 mr-2 animate-spin", {
	variants: {
		size: {
			sm: "h-4 w-4",
			default: "h-6 w-6",
			lg: "h-8 w-8",
		},
		variant: {
			default: "text-white",
			black: "text-black",
			muted: "text-muted-foreground",
		},
	},
	defaultVariants: {
		size: "default",
		variant: "default",
	},
});

interface LoaderProps extends VariantProps<typeof loaderVariants> {
	className?: string;
}

function Loader({ className, size, variant }: LoaderProps) {
	return <LoaderIcon className={cn(loaderVariants({ size, variant, className }))} />;
}

export { Loader };
