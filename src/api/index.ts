import {
	deleteClient,
	insertClient,
	listClients,
	searchClients,
	updateClient,
} from "./server-actions/client-server-actions";
import { deleteDog, getDogById, insertDog, listDogs, searchDogs, updateDog } from "./server-actions/dog-server-actions";
import {
	getClientRelationships,
	getVetClinicRelationships,
	getVetRelationships,
} from "./server-actions/relationship-server-actions";
import {
	deleteVetClinic,
	insertVetClinic,
	listVetClinics,
	searchVetClinics,
	updateVetClinic,
} from "./server-actions/vet-clinic-server-actions";
import { deleteVet, insertVet, listVets, searchVets, updateVet } from "./server-actions/vet-server-actions";
import { type ExtractServerActionData } from "./utils";

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
};

type DogsList = ExtractServerActionData<typeof listDogs>;
type DogsSearch = ExtractServerActionData<typeof searchDogs>;
type DogById = ExtractServerActionData<typeof getDogById>;
type DogInsert = ExtractServerActionData<typeof insertDog>;
type DogUpdate = ExtractServerActionData<typeof updateDog>;
type DogDelete = ExtractServerActionData<typeof deleteDog>;

type ClientsList = ExtractServerActionData<typeof listClients>;
type ClientsSearch = ExtractServerActionData<typeof searchClients>;
type ClientInsert = ExtractServerActionData<typeof insertClient>;
type ClientUpdate = ExtractServerActionData<typeof updateClient>;
type ClientDelete = ExtractServerActionData<typeof deleteClient>;
type ClientRelationships = ExtractServerActionData<typeof getClientRelationships>;

type VetsList = ExtractServerActionData<typeof listVets>;
type VetsSearch = ExtractServerActionData<typeof searchVets>;
type VetInsert = ExtractServerActionData<typeof insertVet>;
type VetUpdate = ExtractServerActionData<typeof updateVet>;
type VetDelete = ExtractServerActionData<typeof deleteVet>;
type VetRelationships = ExtractServerActionData<typeof getVetRelationships>;

type VetClinicsList = ExtractServerActionData<typeof listVetClinics>;
type VetClinicsSearch = ExtractServerActionData<typeof searchVetClinics>;
type VetClinicInsert = ExtractServerActionData<typeof insertVetClinic>;
type VetClinicUpdate = ExtractServerActionData<typeof updateVetClinic>;
type VetClinicDelete = ExtractServerActionData<typeof deleteVetClinic>;
type VetClinicRelationships = ExtractServerActionData<typeof getVetClinicRelationships>;

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

export type {
	DogsList,
	DogsSearch,
	DogById,
	DogInsert,
	DogUpdate,
	DogDelete,
	ClientsList,
	ClientsSearch,
	ClientInsert,
	ClientUpdate,
	ClientDelete,
	ClientRelationships,
	VetsList,
	VetsSearch,
	VetInsert,
	VetUpdate,
	VetDelete,
	VetRelationships,
	VetClinicsList,
	VetClinicsSearch,
	VetClinicInsert,
	VetClinicUpdate,
	VetClinicDelete,
	VetClinicRelationships,
};
export { api };
