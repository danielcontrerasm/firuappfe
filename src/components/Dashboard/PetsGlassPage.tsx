// PetsGlassPage.tsx
import React from "react";
import PetTrackingGlassLayout, { Pet } from "./PetTrackingGlassLayout.tsx";

const mockPets: Pet[] = [
  {
    id: "1",
    name: "Firu",
    species: "Dog",
    status: "online",
    lastSeen: "3 min ago",
    battery: 82,
    ownerName: "Daniel",
    collarId: "COL-001",
  },
  {
    id: "2",
    name: "Misu",
    species: "Cat",
    status: "offline",
    lastSeen: "45 min ago",
    battery: 40,
    ownerName: "Daniel",
    collarId: "COL-002",
  },
  {
    id: "3",
    name: "Luna",
    species: "Dog",
    status: "lost",
    lastSeen: "Yesterday 18:30",
    battery: 12,
    ownerName: "Daniel",
    collarId: "COL-003",
  },
];

const PetsGlassPage: React.FC = () => {
  return (
    <PetTrackingGlassLayout
      pets={mockPets}
      onRefresh={() => console.log("refresh pets")}
    />
  );
};

export default PetsGlassPage;
