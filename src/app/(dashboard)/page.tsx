import { type Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Dashboard | Dogworx Management",
};

function RootPage() {
	if (process.env.NODE_ENV !== "development") {
		redirect("/calendar/week");
	} else {
		redirect("/test");
	}
}

export default RootPage;
