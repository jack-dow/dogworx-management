import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";

import { generateId } from "~/lib/utils";
import type {
	Client,
	Dog,
	DogSession,
	DogToClientRelationship,
	DogToVetRelationship,
	Organization,
	User,
	VerificationCode,
	Vet,
	VetClinic,
	VetToVetClinicRelationship,
} from "../schemas";

const defaultOrgId = generateId();
const defaultUserId = generateId();

function generateOrganization() {
	const organization = {
		id: defaultOrgId,
		name: "Dogworx Management",
		maxUsers: 1,
		createdAt: faker.date.past({ years: 2 }),
		updatedAt: faker.date.past({ years: 2 }),
		notes: null,
	} satisfies Organization;

	const user = {
		id: defaultUserId,
		organizationId: defaultOrgId,
		name: "Jack Dow",
		givenName: "Jack",
		familyName: "Dow",
		emailAddress: "jack.dowww@gmail.com",
		createdAt: new Date(),
		updatedAt: new Date(),
		organizationRole: "owner",
		bannedAt: null,
		bannedUntil: null,
		profileImageUrl: null,
	} satisfies User;

	const verificationCode = {
		id: generateId(),
		emailAddress: user.emailAddress,
		code: "111111",
		token: null,
		expiresAt: faker.date.future({ years: 2 }),
	} satisfies VerificationCode;

	return {
		organization,
		user,
		verificationCode,
	};
}

function generateDogs() {
	const dogs: Dog[] = [];

	for (let i = 0; i < faker.number.int({ min: 5, max: 15 }); i++) {
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
			organizationId: defaultOrgId,
		});
	}

	return dogs;
}

function generateDogSessions(dogs: Dog[]) {
	const sessions: DogSession[] = [];

	for (const dog of dogs) {
		for (let i = 0; i < faker.number.int({ min: 0, max: 10 }); i++) {
			const createdAt = faker.date.past({ years: 2 });
			sessions.push({
				id: createId(),
				dogId: dog.id,
				userId: defaultUserId,
				date: faker.date.between({ from: createdAt, to: new Date() }),
				createdAt,
				updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
				details: faker.lorem.paragraphs({ min: 1, max: 3 }),
				organizationId: defaultOrgId,
			});
		}
	}
	return sessions;
}

function generateClients() {
	const clients: Client[] = [];

	for (let i = 0; i < faker.number.int({ min: 5, max: 15 }); i++) {
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
			organizationId: defaultOrgId,
		});
	}

	return clients;
}

function generateVets() {
	const vets: Vet[] = [];

	for (let i = 0; i < faker.number.int({ min: 3, max: 10 }); i++) {
		const createdAt = faker.date.past({ years: 2 });
		vets.push({
			id: createId(),
			createdAt,
			updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
			givenName: faker.person.firstName(),
			familyName: faker.person.lastName(),
			emailAddress: faker.internet.email(),
			phoneNumber: faker.phone.number("04########"),
			notes: faker.lorem.paragraphs({ min: 0, max: 3 }),
			organizationId: defaultOrgId,
		});
	}

	return vets;
}

function generateVetClinics() {
	const vetClinics: VetClinic[] = [];

	for (let i = 0; i < faker.number.int({ min: 2, max: 4 }); i++) {
		const createdAt = faker.date.past({ years: 2 });
		vetClinics.push({
			id: createId(),
			createdAt,
			updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
			name: faker.company.name(),
			emailAddress: faker.internet.email(),
			phoneNumber: faker.phone.number("04########"),
			notes: faker.lorem.paragraphs({ min: 0, max: 3 }),
			organizationId: defaultOrgId,
		});
	}

	return vetClinics;
}

function generateDogToClientRelationships(dogs: Dog[], clients: Client[]) {
	const relationships: DogToClientRelationship[] = [];

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
				organizationId: defaultOrgId,
			});
		}
	}

	return relationships;
}

function generateDogToVetRelationships(dogs: Dog[], vets: Vet[]) {
	const relationships: DogToVetRelationship[] = [];

	for (const dog of dogs) {
		const relationshipTypes = ["primary", "secondary"] as const;

		let notChosenVets = [...vets];

		for (let i = 0; i < faker.number.int({ min: 0, max: 4 }); i++) {
			const vetId = faker.helpers.arrayElement(notChosenVets).id;
			notChosenVets = notChosenVets.filter((vet) => vet.id !== vetId);

			const createdAt = faker.date.past({ years: 2 });

			relationships.push({
				id: createId(),
				createdAt: createdAt,
				updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
				dogId: dog.id,
				vetId: vetId,
				relationship: faker.helpers.arrayElement(relationshipTypes),
				organizationId: defaultOrgId,
			});
		}
	}

	return relationships;
}

function generateVetToVetClinicRelationships(vets: Vet[], vetClinics: VetClinic[]) {
	const relationships: VetToVetClinicRelationship[] = [];

	for (const vet of vets) {
		const relationshipTypes = ["full-time", "part-time"] as const;

		let notChosenVetClinics = [...vetClinics];

		for (let i = 0; i < faker.number.int({ min: 0, max: 4 }); i++) {
			const vetClinicId = faker.helpers.arrayElement(notChosenVetClinics).id;
			notChosenVetClinics = notChosenVetClinics.filter((vetClinic) => vetClinic.id !== vetClinicId);

			const createdAt = faker.date.past({ years: 2 });

			relationships.push({
				id: createId(),
				createdAt: createdAt,
				updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
				vetId: vet.id,
				vetClinicId: vetClinicId,
				relationship: faker.helpers.arrayElement(relationshipTypes),
				organizationId: defaultOrgId,
			});
		}
	}

	return relationships;
}

function generateSeedData() {
	const { organization, user, verificationCode } = generateOrganization();

	const dogs = generateDogs();
	const dogSessions = generateDogSessions(dogs);
	const clients = generateClients();
	const vets = generateVets();
	const vetClinics = generateVetClinics();
	const dogToClientRelationships = generateDogToClientRelationships(dogs, clients);
	const dogToVetRelationships = generateDogToVetRelationships(dogs, vets);
	const vetToVetClinicRelationships = generateVetToVetClinicRelationships(vets, vetClinics);

	return {
		organization,
		user,
		verificationCode,
		dogs,
		dogSessions,
		clients,
		vets,
		vetClinics,
		dogToClientRelationships,
		dogToVetRelationships,
		vetToVetClinicRelationships,
	};
}

export default generateSeedData;
