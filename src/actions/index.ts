import {
	deleteBookingType,
	getBookingTypeById,
	insertBookingType,
	listBookingTypes,
	searchBookingTypes,
	updateBookingType,
} from "./app/booking-types-actions";
import {
	deleteBooking,
	getBookingById,
	getBookingsByWeek,
	insertBooking,
	listBookings,
	searchBookings,
	updateBooking,
} from "./app/bookings-actions";
import {
	deleteClient,
	getClientById,
	insertClient,
	listClients,
	searchClients,
	updateClient,
} from "./app/clients-actions";
import { deleteDog, getDogById, insertDog, listDogs, searchDogs, updateDog } from "./app/dogs-actions";
import { getUserById, listUsers, searchUsers, setUserTimezoneOffset } from "./app/users-actions";
import {
	deleteVetClinic,
	getVetClinicById,
	insertVetClinic,
	listVetClinics,
	searchVetClinics,
	updateVetClinic,
} from "./app/vet-clinics-actions";
import { deleteVet, getVetById, insertVet, listVets, searchVets, updateVet } from "./app/vets-actions";
import {
	deleteOrganization,
	getCurrentOrganization,
	getOrganizationById,
	getOrganizationInviteLinkById,
	insertOrganization,
	listOrganizations,
	searchOrganizations,
	updateOrganization,
} from "./auth/organizations-actions";
import { getCurrentSession, invalidateSession } from "./auth/sessions-actions";
import { deleteUser, updateUser } from "./auth/user-actions";

const actions = {
	app: {
		clients: {
			list: listClients,
			search: searchClients,
			byId: getClientById,
			insert: insertClient,
			update: updateClient,
			delete: deleteClient,
		},
		dogs: {
			list: listDogs,
			search: searchDogs,
			byId: getDogById,
			insert: insertDog,
			update: updateDog,
			delete: deleteDog,
		},
		bookings: {
			list: listBookings,
			search: searchBookings,
			week: getBookingsByWeek,
			byId: getBookingById,
			insert: insertBooking,
			update: updateBooking,
			delete: deleteBooking,
		},
		bookingTypes: {
			list: listBookingTypes,
			search: searchBookingTypes,
			byId: getBookingTypeById,
			insert: insertBookingType,
			update: updateBookingType,
			delete: deleteBookingType,
		},
		vetClinics: {
			list: listVetClinics,
			search: searchVetClinics,
			byId: getVetClinicById,
			insert: insertVetClinic,
			update: updateVetClinic,
			delete: deleteVetClinic,
		},
		vets: {
			list: listVets,
			search: searchVets,
			byId: getVetById,
			insert: insertVet,
			update: updateVet,
			delete: deleteVet,
		},
		users: {
			list: listUsers,
			search: searchUsers,
			byId: getUserById,
			setTimezoneOffset: setUserTimezoneOffset,
		},
	},
	auth: {
		organizations: {
			list: listOrganizations,
			search: searchOrganizations,
			byId: getOrganizationById,
			current: getCurrentOrganization,
			insert: insertOrganization,
			update: updateOrganization,
			delete: deleteOrganization,
			getInviteLink: getOrganizationInviteLinkById,
		},
		sessions: {
			current: getCurrentSession,
			invalidate: invalidateSession,
		},
		user: {
			update: updateUser,
			delete: deleteUser,
		},
	},
};

export { actions };

export type * from "./app/clients-actions";
export type * from "./app/dogs-actions";
export type * from "./app/bookings-actions";
export type * from "./app/booking-types-actions";
export type * from "./app/users-actions";
export type * from "./app/vet-clinics-actions";
export type * from "./app/vets-actions";

export type * from "./auth/organizations-actions";
export type * from "./auth/sessions-actions";
export type * from "./auth/user-actions";
