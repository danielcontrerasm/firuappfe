# Lesson 7: Lists and conditional UI

## Goal

Learn how React repeats content and chooses what to show.

## In easy words

A dashboard is mostly repeated information: cards, alerts, markers, and menu items.

JavaScript map creates one element for each item.

## Rendering a list

~~~jsx
<ul>
  {pets.map((pet) => (
    <li key={pet.id}>
      {pet.name}
    </li>
  ))}
</ul>
~~~

The key tells React which item is which. Use a stable ID from the data. Avoid the array index when items can be filtered, inserted, or reordered.

## FiruApp list

FiruappPetList maps pets into Material UI ListItemButton elements. It uses pet.id as the key.

The item can show:

- photo or first-letter fallback
- name
- LIVE or LOST label
- breed, age, and weight
- battery value
- selected styling
- a context menu action

## Conditional rendering

The dashboard has several possible states:

~~~jsx
{loading && <p>Loading pets...</p>}
{error && <p>{error}</p>}
{!loading && !error && pets.length === 0 && (
  <p>No pets found.</p>
)}
{selectedPet && <Details pet={selectedPet} />}
~~~

The user should always know what is happening.

## Ternary rendering

Use a ternary when there are two choices:

~~~jsx
<span>{pet.status === "lost" ? "LOST" : "LIVE"}</span>
~~~

Use a small helper when the condition becomes complex:

~~~js
function getStatusLabel(status) {
  if (status === "lost") return "LOST";
  return "LIVE";
}
~~~

## Empty, loading, error, and ready

These are different states:

~~~text
loading -> data is being requested
error   -> request failed
empty   -> request worked but there are no records
ready   -> records can be shown
~~~

Do not show an empty message while a request is still loading.

## Accessibility

The pet list uses a clickable ListItemButton. That is better than making a random div clickable because it can behave like a control.

For icon-only actions:

- add an aria-label
- make the focus state visible
- use a button for an action
- use a link for navigation

For images, provide useful alt text when the image communicates information.

## Key concepts

- **map:** repeat UI for data.
- **key:** stable identity for a repeated element.
- **Conditional rendering:** show UI only when a condition is true.
- **Empty state:** explains that there is no data.
- **Loading state:** explains that data is not ready yet.
- **Semantic HTML:** use an element that matches the action.

## Practice

1. Render a list of alerts.
2. Add a no-results message.
3. Add a loading placeholder.
4. Replace an index key with a stable ID.
5. Add an aria-label to an icon-only button.

## Mini challenge

Create a PetResults component that supports all four states and receives:

~~~text
pets
loading
error
onSelect
~~~

## Check your work

You are ready when the screen remains understandable while data is loading, missing, or failing.

