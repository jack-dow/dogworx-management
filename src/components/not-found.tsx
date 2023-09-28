"use client";

import Image from "next/image";
import { useParams, usePathname } from "next/navigation";

import NotFoundImage from "~/assets/not-found.svg";
import { ExclamationTriangleOutlineIcon } from "./ui/icons";

function NotFound() {
	const pathname = usePathname();
	const params = useParams();

	const name = pathname.split("/")?.[1];

	return (
		<div className="flex w-full flex-col items-center justify-center ">
			<div className="max-w-md pb-8 text-center">
				<ExclamationTriangleOutlineIcon className="mx-auto h-8 w-8 text-muted-foreground" />

				<h2 className="mt-4 text-lg font-semibold leading-6 text-gray-900">
					No {name?.split("-").join(" ")} found with id: &quot;{params.id}&quot;
				</h2>
				<p className="mt-1 text-sm text-gray-500">
					Please check the URL in your browser&apos;s address bar and try again. If you believe this is an error, please
					contact support.
				</p>
			</div>
			<Image src={NotFoundImage as string} alt="404 Not Found Illustration" width={600} height={400} />
		</div>
	);
}

export { NotFound };
