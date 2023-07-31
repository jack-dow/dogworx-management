import { type AnyColumn } from "drizzle-orm";

import { clients } from "~/db/schemas";

type SortableColumns = {
	[key: string]: {
		id: string;
		label: string;
		columns: AnyColumn[];
	};
};

const CLIENTS_SORTABLE_COLUMNS = {
	fullName: {
		id: "fullName",
		label: "Full name",
		columns: [clients.givenName, clients.familyName],
	},
	givenName: {
		id: "givenName",
		label: "First name",
		columns: [clients.givenName],
	},
	familyName: {
		id: "familyName",
		label: "Last name",
		columns: [clients.familyName],
	},
	emailAddress: {
		id: "emailAddress",
		label: "Email address",
		columns: [clients.emailAddress],
	},
	phoneNumber: {
		id: "phoneNumber",
		label: "Phone number",
		columns: [clients.phoneNumber],
	},
	createdAt: {
		id: "createdAt",
		label: "Created at",
		columns: [clients.createdAt],
	},
	updatedAt: {
		id: "updatedAt",
		label: "Last updated at",
		columns: [clients.updatedAt],
	},
} satisfies SortableColumns;

export { type SortableColumns, CLIENTS_SORTABLE_COLUMNS };
