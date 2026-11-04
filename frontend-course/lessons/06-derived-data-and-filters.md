# Lesson 6: Derived data and filters

## Goal

Learn how the dashboard calculates values from state instead of storing unnecessary copies.

## In easy words

State is the source. Derived data is a result.

If you have a list of pets, you can calculate:

- the selected pet
- active pets
- lost pets
- visible pets
- the number of alerts

Do not store all of these as separate state unless you truly need to.

## Small example

~~~jsx
const [pets, setPets] = useState([]);
const [search, setSearch] = useState("");

const visiblePets = useMemo(() => {
  const term = search.trim().toLowerCase();

  return pets.filter((pet) =>
    !term || pet.name.toLowerCase().includes(term)
  );
}, [pets, search]);

const lostCount = visiblePets.filter((pet) => pet.status === "lost").length;
~~~

If pets or search changes, visiblePets is calculated again.

## FiruApp derived values

FiruappDashboard derives:

- live details by pet ID
- filteredDashboardPets
- selectedPet
- selectedPetLocation
- cityOptions
- selectedPetBattery
- lostPets
- activePets
- recentAlertItems

The filter function checks city, neighborhood, owner name, and pet name.

## Why useMemo?

useMemo can avoid repeating an expensive calculation. More importantly for learning, it clearly labels a value as derived from dependencies.

Do not use useMemo for every line. Use it when the calculation is meaningful or expensive, or when stable identity matters for a child.

## Filtering step by step

~~~text
databasePets
  -> add live details
  -> check city
  -> check neighborhood
  -> check owner
  -> check pet name
  -> filteredDashboardPets
~~~

The map, list, summary cards, and alerts all use the filtered result. That keeps the screen consistent.

## Selected pet priority

The dashboard chooses:

1. the current selected ID
2. a lost pet if there is no selection
3. the first available pet

This is product logic. A frontend engineer should be able to describe the priority in plain words.

## Key concepts

- **Derived data:** a value calculated from existing values.
- **Selector:** a function that picks or calculates data for a view.
- **Filter:** a function that keeps matching items.
- **Dependency:** a value that can change the result.
- **Source of truth:** the value from which other values are calculated.

## Practice

1. Add a status filter to a pet list.
2. Show active and lost counts.
3. Keep the selected pet when filters change, but clear it if it disappears.
4. Add a “no matches” message.
5. Decide whether each value belongs in state or can be derived.

## Mini challenge

Create a selector called getDashboardSummary that returns:

~~~text
total
active
lost
lowBattery
~~~

Use it to render four cards.

## Check your work

You are ready when changing one filter updates the list, map, counts, and selected details without duplicated filter logic.

