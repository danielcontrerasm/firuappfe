import { Pet } from "./FiruappStyles.ts";

export const demoPets: Pet[] = [
  {
    id: "mock-2",
    name: "Bella (Demo)",
    status: "active",
    ownerName: "Demo owner",
    city: "Medellín",
    imageUrl: "/german.png",
    breed: "German Shepherd",
    battery: 82,
  },
  {
    id: "mock-3",
    name: "Rocky (Demo)",
    status: "lost",
    ownerName: "Demo owner",
    city: "Medellín",
    imageUrl: "/labrador.png",
    breed: "Labrador",
    battery: 18,
  },
];

export const createDemoPetLocations = (reportedAt = Date.now()) => {
  const timestamp = new Date(reportedAt - 1000).toISOString();
  return demoPets.map((pet, index) => ({
    id: `mock-location-${pet.id}`,
    petId: pet.id,
    petName: pet.name,
    ownerName: pet.ownerName,
    latitude: 6.2442 + index * 0.004,
    longitude: -75.5812 - index * 0.005,
    city: pet.city,
    address: "Demo location",
    timestamp,
    imageUrl: pet.imageUrl,
    status: pet.status,
    batteryPercent: pet.battery,
  }));
};
