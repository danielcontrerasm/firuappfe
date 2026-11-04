# Lesson 3: State and events

## Goal

Understand how a click or keystroke changes the dashboard.

## In easy words

A normal variable can change, but React will not automatically redraw the screen when it changes.

State is React memory. When you call a state setter, React renders the component again with the new value.

## Small example

~~~jsx
function PetSelector({ pets }) {
  const [selectedId, setSelectedId] = useState();

  const selectedPet = pets.find((pet) => pet.id === selectedId);

  return (
    <section>
      <p>{selectedPet ? selectedPet.name : "Choose a pet"}</p>

      {pets.map((pet) => (
        <button
          key={pet.id}
          onClick={() => setSelectedId(pet.id)}
        >
          {pet.name}
        </button>
      ))}
    </section>
  );
}
~~~

The loop is:

~~~text
click
  -> setSelectedId
  -> state changes
  -> component renders again
  -> selectedPet changes
  -> screen changes
~~~

## FiruApp selection

FiruappDashboard stores:

~~~text
selectedPetId
~~~

It passes that value to the map and list. Both children can call the same setter.

A marker click and a list click therefore produce the same result.

## Updating an object

The dashboard keeps several filters in one object:

~~~jsx
const [petFilters, setPetFilters] = useState({
  city: "",
  neighborhood: "",
  ownerName: "",
  petName: "",
});
~~~

To change only one field, keep the other fields:

~~~jsx
setPetFilters((current) => ({
  ...current,
  ownerName: event.target.value,
}));
~~~

The spread operator copies the old object. The new field replaces only ownerName.

## Functional updates

When the next value depends on the previous value, use a function:

~~~jsx
setAlertMessages((currentAlerts) => [
  newAlert,
  ...currentAlerts,
].slice(0, 5));
~~~

This is safer than reading a possibly old variable.

## State or normal variable?

Use state when a value affects what the user sees or what the user can do.

Use a normal variable for a temporary calculation inside one render.

Use derived data when a value can be calculated from state.

## Key concepts

- **State:** component memory that causes a new render.
- **Setter:** function that asks React to update state.
- **Event handler:** function called by a user action.
- **Controlled input:** an input whose value comes from React state.
- **Immutable update:** create a new object or array instead of changing the old one.
- **Single source of truth:** keep important information in one place.

## Practice

1. Add a selected alert state to a small component.
2. Make the search input controlled.
3. Add a Clear filters button.
4. Make the map and pet list use one selected ID.
5. Explain why changing a normal variable does not redraw React UI.

## Mini challenge

Add a filter button that toggles between all pets and lost pets. Use one state value and a derived filtered array.

## Check your work

You are ready when you can trace a button from its onClick to the exact piece of UI that changes.

