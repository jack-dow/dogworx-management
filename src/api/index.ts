import {
	deleteClient,
	insertClient,
	listClients,
	searchClients,
	updateClient,
} from "./server-actions/clients-server-actions";
import {
	deleteDog,
	getDogById,
	insertDog,
	listDogs,
	searchDogs,
	updateDog,
} from "./server-actions/dogs-server-actions";
import {
	deleteOrganization,
	getOrganizationInviteLinkById,
	insertOrganization,
	listOrganizations,
	searchOrganizations,
	updateOrganization,
} from "./server-actions/organizations-server-actions";
import {
	getClientRelationships,
	getVetClinicRelationships,
	getVetRelationships,
} from "./server-actions/relationships-server-actions";
import {
	deleteVetClinic,
	insertVetClinic,
	listVetClinics,
	searchVetClinics,
	updateVetClinic,
} from "./server-actions/vet-clinics-server-actions";
import { deleteVet, insertVet, listVets, searchVets, updateVet } from "./server-actions/vets-server-actions";

const api = {
	dogs: {
		list: listDogs,
		search: searchDogs,
		byId: getDogById,
		insert: insertDog,
		update: updateDog,
		delete: deleteDog,
	},
	clients: {
		list: listClients,
		search: searchClients,
		insert: insertClient,
		update: updateClient,
		delete: deleteClient,
		getRelationships: getClientRelationships,
	},
	vets: {
		list: listVets,
		search: searchVets,
		insert: insertVet,
		update: updateVet,
		delete: deleteVet,
		getRelationships: getVetRelationships,
	},
	vetClinics: {
		list: listVetClinics,
		search: searchVetClinics,
		insert: insertVetClinic,
		update: updateVetClinic,
		delete: deleteVetClinic,
		getRelationships: getVetClinicRelationships,
	},
	organizations: {
		list: listOrganizations,
		search: searchOrganizations,
		insert: insertOrganization,
		update: updateOrganization,
		delete: deleteOrganization,
		getInviteLink: getOrganizationInviteLinkById,
	},
};

export type * from "./server-actions/clients-server-actions";
export type * from "./server-actions/dogs-server-actions";
export type * from "./server-actions/organizations-server-actions";
export type * from "./server-actions/relationships-server-actions";
export type * from "./server-actions/vet-clinics-server-actions";
export type * from "./server-actions/vets-server-actions";

export * from "./validations/clerk";
export * from "./validations/clients";
export * from "./validations/dog-sessions";
export * from "./validations/dog-to-client-relationships";
export * from "./validations/dog-to-vet-relationships";
export * from "./validations/dogs";
export * from "./validations/utils";
export * from "./validations/vet-clinics";
export * from "./validations/vet-to-vet-clinic-relationships";
export * from "./validations/vets";

export { generateId } from "./utils";

export { api };
