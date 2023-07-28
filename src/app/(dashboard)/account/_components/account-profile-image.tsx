"use client";

import * as React from "react";
import Image from "next/image";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useFormContext } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { TrashIcon } from "~/components/ui/icons";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { type ManageAccountFormSchema } from "./manage-account-form";

function AccountProfileImage({ setUploadedProfileImage }: { setUploadedProfileImage: (file: File | null) => void }) {
	const { toast } = useToast();
	const { setValue, watch } = useFormContext<ManageAccountFormSchema>();

	const onDrop = React.useCallback(
		(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
			acceptedFiles.forEach((file) => {
				setUploadedProfileImage(file);

				setValue("profileImageUrl", URL.createObjectURL(file));
			});

			rejectedFiles.forEach((file) => {
				toast({
					title: `Failed to upload file: "${file.file.name}"`,
					description: file.errors
						.map((error) =>
							error.code === "file-invalid-type"
								? "Profile images can only have a file type of JPG/JPEG or PNG"
								: error.code === "too-many-files"
								? "You can only upload one profile image"
								: error.message,
						)
						.join("\n"),
				});
			});
		},
		[setValue, toast, setUploadedProfileImage],
	);

	const profileImageUrl = watch("profileImageUrl");

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop,
		noClick: profileImageUrl ? true : false,
		maxFiles: 1,
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpeg", ".jpg"],
		},
		maxSize: 1048576,
	});

	return (
		<div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8 xl:gap-x-24">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Profile Image</h2>
				{/* <p className="text-sm leading-6 text-muted-foreground">
								You can use any of your verified emails to sign in and your primary email address will be displayed
								throughout the app to other users.
							</p> */}
			</div>
			{!profileImageUrl ? (
				<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 xl:col-span-2">
					<div className="sm:p-8">
						<div
							{...getRootProps({
								onClick: (e) => {
									e.preventDefault();
								},
							})}
							className="relative block w-full rounded-lg border-2 border-dashed border-slate-300 p-12 text-center hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
						>
							<input {...getInputProps()} />
							<p className="font-semibold">{isDragActive ? "Drop" : "Drag"} file here </p>
							<p className="mb-2 mt-1 text-sm text-muted-foreground">JPG and PNG only (max. 4MB) </p>
							<Button variant="outline">Select file</Button>
						</div>
					</div>
				</div>
			) : (
				<div className="relative flex w-full flex-1 xl:col-span-2" {...getRootProps()}>
					<div className={cn("z-10 w-full bg-white", isDragActive ? "absolute" : "hidden")}>
						<div className="relative block w-full rounded-lg border-2 border-dashed border-slate-300 p-4 text-center hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
							<input {...getInputProps()} />
							<p className="font-semibold">Drop file here </p>
							<p className="mt-1 text-sm text-muted-foreground">JPG and PNG only (max. 4MB) </p>
						</div>
					</div>

					<div className="flex flex-1 space-x-6">
						<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-gray-100">
							<Image
								src={profileImageUrl}
								alt="User's profile image"
								width={256}
								height={256}
								className="aspect-square rounded-md object-cover"
							/>
						</div>
						<div>
							<div className="flex items-center space-x-3">
								<Button variant="outline" type="button" onClick={open}>
									Choose
								</Button>
								<Button
									variant="ghost"
									type="button"
									size="icon"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setValue("profileImageUrl", undefined);
										setUploadedProfileImage(null);
									}}
								>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</div>
							<p className="mt-2 text-sm text-muted-foreground">JPG and PNG only (max. 4MB) </p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export { AccountProfileImage };
