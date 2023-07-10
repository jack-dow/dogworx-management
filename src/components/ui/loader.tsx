import { cva, type VariantProps } from "class-variance-authority";
// eslint-disable-next-line no-restricted-imports
import { Loader2Icon as LoaderIcon } from "lucide-react";

import { cn } from "~/lib/utils";

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
