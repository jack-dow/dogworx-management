"use client";

import * as React from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Editor } from "@tiptap/react";
import * as chrono from "chrono-node";
import dayjs from "dayjs";
import { useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { DestructiveActionDialog } from "~/components/ui/destructive-action-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormSection } from "~/components/ui/form";
import {
	CalendarIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronUpDownIcon,
	CopyIcon,
	EditIcon,
	EllipsisVerticalIcon,
	TrashIcon,
	XIcon,
} from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader } from "~/components/ui/loader";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { useToast } from "~/components/ui/use-toast";
import { actions, type DogById } from "~/actions";
import { useUser } from "~/app/(dashboard)/providers";
import { InsertDogSessionSchema, SelectUserSchema } from "~/db/validation";
import { cn, generateId } from "~/utils";
import { type ManageDogFormSchema } from "./manage-dog-form";

const EditableSessionDetailFormSchema = InsertDogSessionSchema.extend({
	details: z
		.string()
		.max(100000, { message: "Details must be less than 100,000 characters long." })
		.nonempty({ message: "Must include some details about this session" }),
	date: z.date({
		required_error: "Must select a date for this session",
	}),
	user: SelectUserSchema.pick({
		id: true,
		givenName: true,
		familyName: true,
		emailAddress: true,
		organizationId: true,
		organizationRole: true,
		profileImageUrl: true,
	}).nullable(),
});
type EditableSessionDetailFormSchema = z.infer<typeof EditableSessionDetailFormSchema>;

type DogSession = EditableSessionDetailFormSchema | DogById["dogSessions"][number];

function DogSessions({ isNew, dogSessions }: { isNew: boolean; dogSessions?: DogById["dogSessions"] }) {
	const { toast } = useToast();
	const form = useFormContext<ManageDogFormSchema>();

	const [_dogSessions, setDogSessions] = React.useState<Array<DogSession>>(dogSessions ?? []);

	const [page, setPage] = React.useState(1);
	const [loadedPages, setLoadedPages] = React.useState(1);
	const [isLoading, setIsLoading] = React.useState(false);
	const [hasMore, setHasMore] = React.useState(_dogSessions.length > 3);

	const [confirmSessionDelete, setConfirmSessionDelete] = React.useState<string | null>(null);

	const visibleSessions = [..._dogSessions]
		.sort((a, b) => {
			// Compare by date in descending order
			if (b.date > a.date) return 1;
			if (b.date < a.date) return -1;

			// If dates are the same, compare cuids as strings
			return a.id.localeCompare(b.id);
		})
		.slice((page - 1) * 3, page * 3);

	function removeSessionFromUnsavedSessions(sessionId: string) {
		const unsavedSessionIds = form.getValues("unsavedSessionIds");
		if (unsavedSessionIds.includes(sessionId)) {
			form.setValue(
				"unsavedSessionIds",
				unsavedSessionIds.filter((i) => i !== sessionId),
			);
		}
	}

	return (
		<>
			<DestructiveActionDialog
				name="session"
				withoutTrigger
				open={!!confirmSessionDelete}
				onOpenChange={() => setConfirmSessionDelete(null)}
				onConfirm={async () => {
					if (confirmSessionDelete) {
						if (isNew) {
							const dogSessionActions = form.getValues("actions.dogSessions");

							delete dogSessionActions[confirmSessionDelete];

							form.setValue("actions.dogSessions", dogSessionActions);

							setDogSessions(_dogSessions.filter((f) => f.id !== confirmSessionDelete));
							removeSessionFromUnsavedSessions(confirmSessionDelete);

							if (visibleSessions.length - 1 === 0) {
								setPage(page - 1);
								setLoadedPages(loadedPages - 1);
							}
							return;
						}

						await actions.app.dogSessions
							.delete({ id: confirmSessionDelete, dogId: form.getValues("id") })
							.then((result) => {
								if (!result.success) {
									throw new Error("Failed to delete session");
								}

								setDogSessions(_dogSessions.filter((f) => f.id !== confirmSessionDelete));
								removeSessionFromUnsavedSessions(confirmSessionDelete);

								if (_dogSessions.length - 1 < result.data.count) {
									setHasMore(true);
								}

								if (_dogSessions.length - 1 === result.data.count) {
									setHasMore(false);
								}

								if (visibleSessions.length - 1 === 0) {
									setPage(page - 1);
									setLoadedPages(loadedPages - 1);
								}

								toast({
									title: "Session deleted",
									description: "This session has been successfully deleted.",
								});
							})
							.catch(() => {
								toast({
									title: "Session deletion failed",
									description: "There was an error deleting this session. Please try again.",
								});
							});
					}
				}}
			/>

			<FormSection title="Session History" description="Keep track of details about this dog's sessions.">
				<div className="space-y-8">
					<EditableSessionDetail
						dogId={form.getValues("id")}
						onSubmit={async (session) => {
							if (isNew) {
								setDogSessions([..._dogSessions, session]);
								removeSessionFromUnsavedSessions(session.id);

								form.setValue(
									"actions.dogSessions",
									{
										...form.getValues("actions.dogSessions"),
										[session.id]: {
											type: "INSERT",
											payload: session,
										},
									},
									{ shouldDirty: true },
								);
								return;
							}

							await actions.app.dogSessions
								.insert(session)
								.then((result) => {
									if (!result.success) {
										throw new Error("Failed to create session");
									}

									setDogSessions([..._dogSessions, session]);
									removeSessionFromUnsavedSessions(session.id);

									if (_dogSessions.length + 1 > loadedPages * 3) {
										setHasMore(true);
									}

									toast({
										title: "Session created",
										description: "Session has been successfully created.",
									});
								})
								.catch(() => {
									toast({
										title: "Session creation failed",
										description: "There was an error adding this session. Please try again.",
									});
								});
						}}
						onDetailsTextChange={(text, id) => {
							const unsavedSessionIds = form.getValues("unsavedSessionIds");
							if (text && !unsavedSessionIds.includes(id)) {
								form.setValue("unsavedSessionIds", [...unsavedSessionIds, id]);
							}

							if (!text) {
								removeSessionFromUnsavedSessions(id);
							}
						}}
					/>

					<div>
						<ul role="list" className="-mb-8">
							{visibleSessions.map((session, index) => {
								return (
									<SessionDetail
										key={session.id}
										dogId={form.getValues("id")}
										session={session}
										isLast={index === 2 || index === visibleSessions.length - 1}
										onUpdate={async (updatedSession) => {
											if (isNew) {
												setDogSessions((prev) =>
													prev.map((s) => {
														if (s.id === updatedSession.id) {
															return updatedSession;
														}

														return s;
													}),
												);

												removeSessionFromUnsavedSessions(updatedSession.id);
												return;
											}

											await actions.app.dogSessions
												.update(updatedSession)
												.then((result) => {
													if (!result.success) {
														throw new Error("Failed to update session");
													}

													setDogSessions((prev) =>
														prev.map((s) => {
															if (s.id === updatedSession.id) {
																return updatedSession;
															}

															return s;
														}),
													);
													removeSessionFromUnsavedSessions(updatedSession.id);

													toast({
														title: "Session updated",
														description: "Session has been successfully updated.",
													});
												})
												.catch(() => {
													toast({
														title: "Session update failed",
														description: "There was an error updating this session. Please try again.",
													});
												});
										}}
										onCopy={(session) => {
											setDogSessions((prev) => [...prev, session]);

											if (_dogSessions.length + 1 > loadedPages * 3) {
												setHasMore(true);
											}
										}}
										onDelete={() => {
											setConfirmSessionDelete(session.id);
										}}
										onDetailsTextChange={(text, id) => {
											const unsavedSessionIds = form.getValues("unsavedSessionIds");
											if (text && !unsavedSessionIds.includes(id)) {
												form.setValue("unsavedSessionIds", [...unsavedSessionIds, id]);
											}

											if (!text) {
												removeSessionFromUnsavedSessions(id);
											}
										}}
										onCancel={() => {
											removeSessionFromUnsavedSessions(session.id);
										}}
									/>
								);
							})}
						</ul>
					</div>

					{visibleSessions.length > 0 && (
						<div className="flex items-center justify-center space-x-2">
							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								disabled={page === 1}
								onClick={() => {
									setPage(page - 1);
									setHasMore(true);
								}}
							>
								<span className="sr-only">Go to previous page</span>
								<ChevronLeftIcon className="h-4 w-4" />
							</Button>

							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								disabled={isNew ? _dogSessions.length <= page * 3 : !hasMore || isLoading}
								onClick={() => {
									if (page !== loadedPages || isNew) {
										if (page + 1 === loadedPages && _dogSessions.length <= loadedPages * 3) {
											setHasMore(false);
										}
										setPage(page + 1);
										return;
									}

									if (_dogSessions.length > loadedPages * 3) {
										setIsLoading(true);
										const cursor = [..._dogSessions]
											.sort((a, b) => {
												// Compare by date in descending order
												if (b.date > a.date) return 1;
												if (b.date < a.date) return -1;

												// If dates are the same, compare cuids as strings
												return a.id.localeCompare(b.id);
											})
											.pop()!;

										actions.app.dogSessions
											.search(cursor)
											.then((result) => {
												if (!result.success) {
													throw new Error("Failed to load sessions");
												}

												setDogSessions((prev) => [...prev, ...result.data]);
												setPage(page + 1);
												setLoadedPages(loadedPages + 1);
												setHasMore(result.data.length === 3);
											})
											.catch(() => {
												toast({
													title: "Failed to load sessions",
													description: "There was an error loading more sessions. Please try again.",
												});
											})
											.finally(() => {
												setIsLoading(false);
											});
										return;
									}
								}}
							>
								<span className="sr-only">Go to next page</span>
								{isLoading ? (
									<Loader size="sm" variant="black" className="mr-0" />
								) : (
									<ChevronRightIcon className="h-4 w-4" />
								)}
							</Button>
						</div>
					)}
				</div>
			</FormSection>
		</>
	);
}

function SessionDetail({
	session,
	dogId,
	isLast,
	onDetailsTextChange,
	onUpdate,
	onCopy,
	onDelete,
	onCancel,
}: {
	session: DogSession;
	isLast: boolean;
	dogId: string;
	onDetailsTextChange: (text: string, id: string) => void;
	onUpdate: (session: DogSession) => Promise<void>;
	onCopy: (session: DogSession) => void;
	onDelete: () => void;
	onCancel: () => void;
}) {
	const { toast } = useToast();
	const [isActionsDropdownOpen, setIsActionsDropdownOpen] = React.useState(false);
	const [isEditing, setIsEditing] = React.useState(false);

	const [isCopying, setIsCopying] = React.useState(false);

	return (
		<li>
			<div className="relative flex justify-between pb-10">
				{!isLast ? (
					<span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
				) : null}
				{isEditing ? (
					<EditableSessionDetail
						dogId={dogId}
						dogSession={session}
						onCancel={() => {
							onCancel();
							setIsEditing(false);
						}}
						onSubmit={async (session) => {
							await onUpdate(session).then(() => {
								setIsEditing(false);
							});
						}}
						onDetailsTextChange={onDetailsTextChange}
					/>
				) : (
					<div className="relative flex items-start space-x-3">
						<div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-8 ring-white">
							{session.user ? (
								session.user.profileImageUrl ? (
									<Image
										src={session.user.profileImageUrl}
										alt="User's profile image"
										width={128}
										height={128}
										className="aspect-square rounded-full object-cover"
									/>
								) : (
									<>
										{session.user.givenName[0]}
										{session.user.familyName?.[0]}
									</>
								)
							) : (
								<>D</>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div>
								<div className="text-sm">
									<p className="font-medium text-slate-900">
										{session.user ? `${session.user.givenName} ${session.user.familyName}` : "Deleted User"}
									</p>
								</div>
								<p className="mt-0.5 text-sm text-slate-500">{dayjs(session.date).format("MMMM D, YYYY")}</p>
							</div>
							<div
								className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap"
								dangerouslySetInnerHTML={{ __html: session.details }}
							/>
						</div>
					</div>
				)}

				<div className="flex justify-end">
					<DropdownMenu open={isActionsDropdownOpen} onOpenChange={setIsActionsDropdownOpen}>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
								<EllipsisVerticalIcon className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[160px] data-[state=closed]:animate-none">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => {
									setIsEditing(!isEditing);
								}}
							>
								{isEditing ? (
									<>
										<XIcon className="mr-2 h-4 w-4 text-muted-foreground/70" />
										Cancel edit
									</>
								) : (
									<>
										<EditIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
										Edit
									</>
								)}
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();

									onDelete();
								}}
							>
								<TrashIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								<span className="truncate">Delete</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									setIsCopying(true);

									const newSession = {
										...session,
										id: generateId(),
									};

									actions.app.dogSessions
										.insert(newSession)
										.then((result) => {
											if (!result.success) {
												throw new Error("Failed to copy session");
											}

											onCopy(newSession);

											toast({
												title: "Session copied",
												description: "Session has been successfully copied.",
											});
										})
										.catch(() => {
											toast({
												title: "Session copy failed",
												description: "There was an error copying this session. Please try again.",
											});
										})
										.finally(() => {
											setIsActionsDropdownOpen(false);
											setIsCopying(false);
										});
								}}
							>
								<CopyIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								<span className="truncate">Copy</span>
								{isCopying && <Loader size="sm" variant="black" className="ml-2 mr-0" />}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</li>
	);
}

type EditableSessionDetailProps =
	| {
			dogSession: DogSession;
			onCancel: () => void;
			onDetailsTextChange: (text: string, id: string) => void;
			onSubmit: (_dogSessions: DogSession) => Promise<void>;
			dogId: string;
	  }
	| {
			dogSession?: never;
			onCancel?: never;
			onDetailsTextChange: (text: string, id: string) => void;
			onSubmit: (_dogSessions: EditableSessionDetailFormSchema) => Promise<void>;
			dogId: string;
	  };

function EditableSessionDetail({
	dogSession,
	onCancel,
	onDetailsTextChange,
	onSubmit,
	dogId,
}: EditableSessionDetailProps) {
	const user = useUser();

	const [editor, setEditor] = React.useState<Editor | null>(null);

	const form = useForm<EditableSessionDetailFormSchema>({
		resolver: zodResolver(EditableSessionDetailFormSchema),
		defaultValues: {
			id: generateId(),
			dogId,
			details: "",
			date: undefined,
			user: user,
			userId: user?.id,
			...dogSession,
		},
	});

	const [isConfirmCancelEditingOpen, setIsConfirmCancelEditingOpen] = React.useState(false);
	const [dateInputValue, setDateInputValue] = React.useState("");
	const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
	const [month, setMonth] = React.useState<Date>(form.getValues("date"));

	return (
		<>
			<Dialog open={isConfirmCancelEditingOpen} onOpenChange={setIsConfirmCancelEditingOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							If you cancel editing, any changes you have made to this session will not be saved.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsConfirmCancelEditingOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (onCancel) {
									onCancel();
								}
							}}
						>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Form {...form}>
				<div className={cn("flex flex-1 items-start space-x-4", dogSession && "pr-2")}>
					<div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-8 ring-white">
						{user.profileImageUrl ? (
							<Image
								src={user.profileImageUrl}
								alt="User's profile image"
								width={128}
								height={128}
								className="aspect-square rounded-full object-cover"
							/>
						) : (
							<>
								{user.givenName[0]}
								{user.familyName?.[0]}
							</>
						)}
					</div>
					<div className="min-w-0 flex-1 space-y-2">
						<div className="relative">
							<div className="rounded-lg shadow-sm ring-1 ring-inset ring-input focus-within:ring-1 focus-within:ring-ring">
								<FormField
									control={form.control}
									name="details"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="sr-only">Add session details</FormLabel>
											<FormControl>
												<RichTextEditor
													id={dogSession?.id ?? "add-session-detail"}
													onEditorChange={setEditor}
													content={dogSession?.details ?? ""}
													className="resize-none rounded-b-none shadow-none ring-0 focus-visible:ring-0"
													onValueChange={({ html, text }) => {
														onDetailsTextChange(text, form.getValues("id"));
														if (text === "") {
															field.onChange(text);
														} else {
															field.onChange(html);
														}
													}}
													autofocus={!!dogSession}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								{/* Spacer element to match the height of the toolbar */}
								<div aria-hidden="true">
									<div className="h-px" />
									<div className="py-2">
										<div className="py-px">
											<div className="h-9" />
										</div>
									</div>
								</div>
							</div>

							<div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
								<FormField
									control={form.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Popover
													open={isDatePickerOpen}
													onOpenChange={(value) => {
														setIsDatePickerOpen(value);
														if (value === false) {
															// Wait for popover to animate out before resetting
															setTimeout(() => {
																setMonth(new Date());
																setDateInputValue("");
															}, 150);
														}
													}}
												>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className="w-full focus-visible:outline-1 focus-visible:outline-offset-0"
														>
															<CalendarIcon className="mr-2 h-4 w-4" />
															<span className="mr-2 truncate">
																{field.value ? dayjs(field.value).format("MMMM D, YYYY") : "Select a date"}
															</span>
															<ChevronUpDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0">
														<div className="space-y-2 p-3 pb-1">
															<Label htmlFor="session-date-input">Date</Label>
															<Input
																id="session-date-input"
																autoComplete="off"
																value={dateInputValue}
																onChange={(e) => {
																	const val = e.target.value;
																	setDateInputValue(val);

																	const date = chrono.parseDate(val) ?? new Date();

																	field.onChange(date);

																	setMonth(date);
																}}
																onKeyDown={(e) => {
																	if (e.key === "Enter") {
																		setIsDatePickerOpen(false);
																	}
																}}
															/>
														</div>
														<Calendar
															mode="single"
															selected={field.value ?? undefined}
															month={month}
															onMonthChange={setMonth}
															onSelect={(value) => {
																if (value) {
																	field.onChange(value);
																}
																setIsDatePickerOpen(false);
																setDateInputValue("");
															}}
															initialFocus={false}
														/>
													</PopoverContent>
												</Popover>
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="shrink-0 space-x-2.5">
									{dogSession && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												if (form.formState.isDirty) {
													setIsConfirmCancelEditingOpen(true);
													return;
												}

												onCancel();
											}}
											className="hidden 2xl:inline-flex"
										>
											Cancel
										</Button>
									)}
									<Button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();

											void form.handleSubmit(async (data) => {
												await onSubmit(data);
												form.reset({
													id: generateId(),
													dogId,
													details: "",
													date: undefined,
													user: user ?? undefined,
													userId: user?.id ?? undefined,
													...dogSession,
												});
												editor?.commands.clearContent();
											})(e);
										}}
										size="sm"
										disabled={(!form.formState.isDirty && !!dogSession) || form.formState.isSubmitting}
									>
										{form.formState.isSubmitting && <Loader size="sm" />}
										{dogSession?.id ? (
											<span>
												Update <span className="hidden md:inline">Session</span>
											</span>
										) : (
											"Add Session"
										)}
									</Button>
								</div>
							</div>
						</div>
						{form.formState.errors?.details && (
							<p className="text-sm font-medium text-destructive">{form.formState.errors?.details?.message}</p>
						)}
						{form.formState.errors?.date && (
							<p className="text-sm font-medium text-destructive">{form.formState.errors?.date?.message}</p>
						)}
					</div>
				</div>
			</Form>
		</>
	);
}

export { DogSessions };
