# Lesson 10: Drag and drop plus quality

## Goal

Build an interactive ordering feature and practice the habits that make frontend code safe to ship.

## In easy words

Drag and drop is a sequence of browser events:

~~~text
dragStart
  -> dragOver
  -> drop
  -> create a new array order
  -> set state
  -> render the new order
~~~

For a dashboard, a useful exercise is a priority list. The order belongs in state.

## Small JavaScript example

~~~jsx
function SortablePetList({ initialPets }) {
  const [pets, setPets] = useState(initialPets);
  const [draggedId, setDraggedId] = useState(null);

  function handleDrop(targetId) {
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = pets.findIndex((pet) => pet.id === draggedId);
    const toIndex = pets.findIndex((pet) => pet.id === targetId);
    const nextPets = pets.slice();
    const movedPet = nextPets.splice(fromIndex, 1)[0];

    nextPets.splice(toIndex, 0, movedPet);
    setPets(nextPets);
    setDraggedId(null);
  }

  return (
    <ul>
      {pets.map((pet) => (
        <li
          key={pet.id}
          draggable
          onDragStart={() => setDraggedId(pet.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(pet.id)}
        >
          <button type="button">{pet.name}</button>
        </li>
      ))}
    </ul>
  );
}
~~~

The old array is not changed. A new array is created and passed to setPets.

## Make it usable

Native dragging is not enough for every user. Add buttons such as Move up and Move down so keyboard users can reorder items too.

Also add:

- a visible drag-over style
- a label explaining the order
- an announcement or status message after a move
- a stable key
- a disabled state when movement is impossible

## Connect it to FiruApp

Create a student-only priority list beside the existing FiruappPetsList. Do not change the production list first.

Possible priority behavior:

- lost pets start at the top
- the user can reorder pets
- the selected pet stays selected after a move
- the order is saved to local storage
- the map still uses the original filtered data

## Quality checklist

Before calling a feature done:

1. Does it work with slow data?
2. Does it work when the API fails?
3. Does it work with no records?
4. Does it work after filtering?
5. Does it work on a narrow screen?
6. Can a keyboard user operate it?
7. Are buttons and links used for the right jobs?
8. Do list items have stable keys?
9. Are timers and connections cleaned up?
10. Can another developer explain the state flow?

## Debugging method

When the screen is wrong, ask in this order:

1. Is the route rendering the component I think it is?
2. Did the event handler run?
3. Did state change?
4. Did the effect run?
5. Did the API response have the shape I expected?
6. Did the adapter create the right UI model?
7. Did the derived filter remove the record?
8. Did the child receive the right prop?
9. Is CSS hiding or moving the element?

This is faster than changing random styles.

## Final challenge

Build a priority-pets feature with:

~~~text
SortablePetList
  -> drag and drop
  -> move up and move down buttons
  -> empty state
  -> selected item style
  -> localStorage persistence
  -> a short manual test checklist
~~~

## Check your work

You are ready for the engineer path when you can make a small change, explain its data flow, test the important states, and leave the project easier to understand.

