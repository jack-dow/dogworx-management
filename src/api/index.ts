import { deleteClient, insertClient, listClients, searchClients, updateClient } from "./routers/clients-router";
import { deleteDog, getDogById, insertDog, listDogs, searchDogs, updateDog } from "./routers/dogs-router";

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

export { api };
