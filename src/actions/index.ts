import {
	deleteClient,
	getClientRelationships,
	insertClient,
	listClients,
	searchClients,
	updateClient,
} from "./app/clients-actions";
import { deleteDog, getDogById, insertDog, listDogs, searchDogs, updateDog } from "./app/dogs-actions";
import {
	deleteVetClinic,
	getVetClinicRelationships,
	insertVetClinic,
	listVetClinics,
	searchVetClinics,
	updateVetClinic,
} from "./app/vet-clinics-actions";
import { deleteVet, getVetRelationships, insertVet, listVets, searchVets, updateVet } from "./app/vets-actions";
import {
	deleteOrganization,
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
			insert: insertClient,
			update: updateClient,
			delete: deleteClient,
			getRelationships: getClientRelationships,
		},
		dogs: {
			list: listDogs,
			search: searchDogs,
			byId: getDogById,
			insert: insertDog,
			update: updateDog,
			delete: deleteDog,
		},
		vetClinics: {
			list: listVetClinics,
			search: searchVetClinics,
			insert: insertVetClinic,
			update: updateVetClinic,
			delete: deleteVetClinic,
			getRelationships: getVetClinicRelationships,
		},
		vets: {
			list: listVets,
			search: searchVets,
			insert: insertVet,
			update: updateVet,
			delete: deleteVet,
			getRelationships: getVetRelationships,
		},
	},
	auth: {
		organizations: {
			list: listOrganizations,
			search: searchOrganizations,
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
export type * from "./app/vet-clinics-actions";
export type * from "./app/vets-actions";

export type * from "./auth/organizations-actions";
export type * from "./auth/sessions-actions";
export type * from "./auth/user-actions";
