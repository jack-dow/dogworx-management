import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

function LoaderIcon({ className }: { className?: string }) {
	return (
		<svg className={cn(className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
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
