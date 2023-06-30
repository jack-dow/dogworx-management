import {
	deleteClient,
	insertClient,
	listClients,
	searchClients,
	updateClient,
} from "./server-actions/client-server-actions";
import { deleteDog, getDogById, insertDog, listDogs, searchDogs, updateDog } from "./server-actions/dog-server-actions";
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

export * from "./validations/clerk";
export * from "./validations/clients";
export * from "./validations/dog-client-relationships";
export * from "./validations/dog-session-history";
export * from "./validations/dogs";
export * from "./validations/utils";

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
};
export { api };
