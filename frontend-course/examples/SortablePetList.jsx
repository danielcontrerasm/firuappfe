import React, { useState } from "react";

export default function SortablePetList({ initialPets }) {
  const [pets, setPets] = useState(initialPets);
  const [draggedId, setDraggedId] = useState(null);
  const [message, setMessage] = useState("");

  function handleDrop(targetId) {
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = pets.findIndex((pet) => pet.id === draggedId);
    const toIndex = pets.findIndex((pet) => pet.id === targetId);
    const nextPets = pets.slice();
    const movedPet = nextPets.splice(fromIndex, 1)[0];

    nextPets.splice(toIndex, 0, movedPet);
    setPets(nextPets);
    setDraggedId(null);
    setMessage("Priority order updated.");
  }

  function moveByButton(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pets.length) return;

    const nextPets = pets.slice();
    const movedPet = nextPets.splice(index, 1)[0];
    nextPets.splice(targetIndex, 0, movedPet);
    setPets(nextPets);
    setMessage("Priority order updated.");
  }

  return (
    <section>
      <h2>Priority pets</h2>
      <p>Drag a pet or use the buttons to change the order.</p>

      <ol>
        {pets.map((pet, index) => (
          <li
            key={pet.id}
            draggable
            onDragStart={() => setDraggedId(pet.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(pet.id)}
          >
            <strong>{pet.name}</strong>
            <span>{pet.status}</span>
            <button
              type="button"
              onClick={() => moveByButton(index, -1)}
              disabled={index === 0}
            >
              Move up
            </button>
            <button
              type="button"
              onClick={() => moveByButton(index, 1)}
              disabled={index === pets.length - 1}
            >
              Move down
            </button>
          </li>
        ))}
      </ol>

      <p role="status">{message}</p>
    </section>
  );
}

