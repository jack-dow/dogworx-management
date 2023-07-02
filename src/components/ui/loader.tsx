import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";
import { LoaderIcon } from "./icons";

const loaderVariants = cva("animate-spin", {
	variants: {
		size: {
			default: "h-6 w-6",
			sm: "h-4 w-4",
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
