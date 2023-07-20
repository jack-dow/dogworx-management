import * as React from "react";
import { useSession } from "@clerk/nextjs";
import { differenceInDays, format } from "date-fns";
import { useFieldArray, type Control } from "react-hook-form";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Loader } from "~/components/ui/loader";
import { useToast } from "~/components/ui/use-toast";
import { type AccountSettingsPageFormSchema } from "./account-settings-page-form";

function formatDate(date: Date) {
	const distanceFromNow = differenceInDays(new Date(), date);

	if (distanceFromNow < 1) {
		return "Today at " + format(date, "h:mm a");
	} else if (distanceFromNow < 2) {
		return "Yesterday at " + format(date, "h:mm a");
	} else if (distanceFromNow < 7) {
		return format(date, "'Last' EEEE 'at' h:mm a");
	} else {
		return format(date, "MMMM do, yyyy 'at' h:mm a");
	}
}

function Sessions({ control }: { control: Control<AccountSettingsPageFormSchema> }) {
	const { session: currentSession } = useSession();

	const sessions = useFieldArray({
		control,
		name: "sessions",
		keyName: "rhf-id",
	});

	const activeSession = sessions.fields.find((session) => session.id === currentSession?.id);

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">Sessions</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					These are the sessions/devices that have logged into your account. Click the session to view more information
					and log it out.
				</p>
			</div>
			<div className="sm:rounded-xl sm:bg-white sm:p-8 sm:shadow-sm sm:ring-1 sm:ring-slate-900/5 md:col-span-2">
				<Accordion type="single" collapsible className="w-full">
					{activeSession && (
						<SessionAccordion
							session={activeSession}
							isCurrentSession
							onDelete={(session) => {
								sessions.remove(sessions.fields.findIndex((s) => s.id === session.id));
							}}
						/>
					)}

					{sessions.fields
						.sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime())
						.map((session) => {
							const isCurrentSession = currentSession?.id === session.id;

							if (isCurrentSession) {
								return null;
							}

							return (
								<SessionAccordion
									key={session.id}
									session={session}
									onDelete={(session) => {
										sessions.remove(sessions.fields.findIndex((s) => s.id === session.id));
									}}
								/>
							);
						})}
				</Accordion>
			</div>
		</div>
	);
}

function SessionAccordion({
	session,
	isCurrentSession = false,
	onDelete,
}: {
	session: AccountSettingsPageFormSchema["sessions"][number];
	isCurrentSession?: boolean;
	onDelete: (session: AccountSettingsPageFormSchema["sessions"][number]) => void;
}) {
	const [isSignOutConfirmDialogOpen, setIsSignOutConfirmDialogOpen] = React.useState(false);
	const [isSigningOut, setIsSigningOut] = React.useState(false);

	const hasCityOrCountry = session.latestActivity.city || session.latestActivity.country;

	const { toast } = useToast();

	if (!isCurrentSession && !session.revoke) return null;
	return (
		<AccordionItem value={session.id}>
			<AccordionTrigger>
				<div className="flex space-x-4">
					<div>
						<p className="text-left">
							{session.latestActivity.deviceType}{" "}
							{hasCityOrCountry
								? `(${session.latestActivity.city ?? ""}${
										session.latestActivity.city && session.latestActivity.country ? ", " : ""
								  }${session.latestActivity.country ?? ""})`
								: ""}
						</p>
						<p className="text-left text-xs text-muted-foreground">{formatDate(session.lastActiveAt)}</p>
					</div>
					<div>{isCurrentSession && <Badge>This Session</Badge>}</div>
				</div>
			</AccordionTrigger>
			<AccordionContent>
				<div className="space-y-4">
					<div className="space-y-1">
						<p className="text-sm font-semibold">Additional Information</p>
						<p className="text-xs text-muted-foreground">
							Browser: {session.latestActivity.browserName} v{session.latestActivity.browserVersion}
						</p>
						<p className="text-xs text-muted-foreground">
							{session.latestActivity.ipAddress ? (
								<>
									IP Address: {session.latestActivity.ipAddress}{" "}
									{hasCityOrCountry
										? `(${session.latestActivity.city ?? ""}${
												session.latestActivity.city && session.latestActivity.country ? ", " : ""
										  }${session.latestActivity.country ?? ""})`
										: ""}
								</>
							) : (
								"IP Address: Unknown"
							)}
						</p>
					</div>
					<div>
						<p className="text-sm font-medium">{isCurrentSession ? "Current session" : "Sign out"}</p>
						<p className="text-xs text-muted-foreground">
							{isCurrentSession
								? "This is the session you are currently using."
								: "Click the button below to sign this session out of your account. "}
						</p>
						{!isCurrentSession && (
							<AlertDialog open={isSignOutConfirmDialogOpen} onOpenChange={setIsSignOutConfirmDialogOpen}>
								<AlertDialogTrigger asChild>
									<Button variant="link" className="-ml-4 text-destructive">
										Remove this session
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Are you sure?</AlertDialogTitle>
										<AlertDialogDescription>
											You are about to sign this session out of your account. If you believe this is a suspicious login,
											please reset your password and contact support.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											variant="destructive"
											disabled={isSigningOut}
											onClick={(e) => {
												e.preventDefault();
												setIsSigningOut(true);
												session
													.revoke()
													.then(() => {
														toast({
															title: "Signed out session",
															description: "Successfully signed session/ out of your account.",
														});
														onDelete(session);
														setIsSignOutConfirmDialogOpen(false);
													})
													.catch((error) => {
														console.log(error);
														toast({
															title: "Failed to sign session out",
															description:
																"An error occurred while signing the session out of your account. Please try again later.",
														});
													})
													.finally(() => {
														setIsSigningOut(false);
													});
											}}
										>
											{isSigningOut && <Loader size="sm" />}
											<span>Sign session out</span>
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}

export { Sessions };
