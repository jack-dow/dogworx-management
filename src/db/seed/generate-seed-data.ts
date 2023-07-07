import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";

import type { Client, Dog, DogClientRelationship, DogSessionHistory } from "../drizzle-schema";

function generateDogSessionHistory(dogs: Dog[]) {
	const sessions: DogSessionHistory[] = [];

	const userIds = [
		"user_2S5LaxszY1bEDCb2DjBgvpD7z5T",
		"user_2S8FmVo2VsrZGxuPcV0pORQGoUI",
		"user_2RlxcHPACDK9F88joWFyMKrMhkJ",
		"user_deleted",
	];

	for (const dog of dogs) {
		for (let i = 0; i < faker.number.int({ min: 0, max: 25 }); i++) {
			const createdAt = faker.date.past({ years: 2 });
			sessions.push({
				id: createId(),
				dogId: dog.id,
				userId: faker.helpers.arrayElement(userIds),
				date: faker.date.between({ from: createdAt, to: new Date() }),
				createdAt,
				updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
				details: faker.lorem.paragraphs({ min: 1, max: 3 }),
			});
		}
	}
	return sessions;
}

function generateDogClientRelationships(dogs: Dog[], clients: Client[]) {
	const relationships: DogClientRelationship[] = [];

	for (const dog of dogs) {
		const relationshipTypes = ["owner", "emergency-contact", "fosterer", "groomer"] as const;
		let notChosenClients = [...clients];

		for (let i = 0; i < faker.number.int({ min: 0, max: 4 }); i++) {
			const clientId = faker.helpers.arrayElement(notChosenClients).id;
			notChosenClients = notChosenClients.filter((client) => client.id !== clientId);

			const createdAt = faker.date.past({ years: 2 });

			relationships.push({
				id: createId(),
				dogId: dog.id,
				clientId: clientId,
				createdAt: faker.date.past({ years: 2 }),
				updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
				relationship: faker.helpers.arrayElement(relationshipTypes),
			});
		}
	}

	return relationships;
}

function generateDogs() {
	const dogs: Dog[] = [];

	for (let i = 0; i < faker.number.int({ min: 10, max: 50 }); i++) {
		const createdAt = faker.date.past({ years: 2 });
		dogs.push({
			id: createId(),
			createdAt,
			updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
			givenName: faker.person.firstName(),
			breed: faker.animal.dog(),
			age: faker.date.past({ years: 12 }),
			isAgeExact: faker.datatype.boolean(),
			sex: faker.helpers.arrayElement(["male", "female", "unknown"]),
			desexed: faker.datatype.boolean(),
			notes: faker.lorem.paragraphs({ min: 0, max: 3 }),
			color: faker.color.human(),
		});
	}

	return dogs;
}

function generateClients() {
	const clients: Client[] = [];

	for (let i = 0; i < faker.number.int({ min: 10, max: 50 }); i++) {
		const createdAt = faker.date.past({ years: 2 });
		clients.push({
			id: createId(),
			createdAt,
			updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
			givenName: faker.person.firstName(),
			familyName: faker.person.lastName(),
			emailAddress: faker.internet.email(),
			phoneNumber: faker.phone.number("04########"),
			streetAddress: faker.location.streetAddress(),
			city: faker.location.city(),
			state: faker.location.state(),
			postalCode: faker.location.zipCode(),
			notes: faker.lorem.paragraphs({ min: 0, max: 3 }),
		});
	}

	return clients;
}

function generateSeedData() {
	const dogs = generateDogs();
	const clients = generateClients();
	const relationships = generateDogClientRelationships(dogs, clients);
	const sessions = generateDogSessionHistory(dogs);

	return {
		dogs: dogs,
		clients: clients,
		dogClientRelationships: relationships,
		dogSessionHistory: sessions,
	};
}

export default generateSeedData;
