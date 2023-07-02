import { RedirectToSignIn, SignedIn, SignedOut, UserProfile } from "@clerk/nextjs";

function ProfilePage() {
	return (
		<>
			<SignedIn>
				<UserProfile />
			</SignedIn>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
		</>
	);
}

export default ProfilePage;
