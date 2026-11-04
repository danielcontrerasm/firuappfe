# Lesson 2: Components, JSX, and props

## Goal

Learn how to split a large dashboard into small pieces that are easier to read and reuse.

## In easy words

A component is a small function with one job.

A component can receive information from its parent. That information is called props. Props are like function arguments.

## Small example

~~~jsx
function PetCard({ pet, onSelect }) {
  return (
    <button onClick={() => onSelect(pet.id)}>
      <strong>{pet.name}</strong>
      <span>{pet.status}</span>
    </button>
  );
}

function PetList({ pets, onSelect }) {
  return (
    <div>
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} onSelect={onSelect} />
      ))}
    </div>
  );
}
~~~

PetList owns the repetition. PetCard owns one card.

## What JSX does

JSX lets you write a readable description of the result:

~~~jsx
<h1>{pet.name}</h1>
~~~

The braces mean: evaluate JavaScript here.

These are also JavaScript expressions inside JSX:

~~~jsx
{pets.length}
{selectedPet && <Details pet={selectedPet} />}
{pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}
~~~

## FiruApp examples

FiruappDashboard defines small components such as:

- SummaryCard
- MetricCard
- SelectedPetAvatar
- DashboardGuideOverlay

Then the main dashboard passes props:

~~~jsx
<SummaryCard
  label="Pets"
  value={filteredDashboardPets.length}
/>
~~~

The summary card does not need to know where the value came from. It only receives the value and displays it.

The parent also passes behavior to children:

~~~jsx
<FiruappPetsList
  pets={filteredDashboardPets}
  selectedId={selectedPet?.id}
  onSelect={setSelectedPetId}
/>
~~~

The child can call onSelect, but the parent still owns the selected ID.

## Component tree

A useful picture is:

~~~text
FiruappDashboard
├── FiruappSidebar
├── SummaryCard
├── FiruappMapView
├── FiruappPetsList
├── MetricCard
└── DashboardGuideOverlay
~~~

## Key concepts

- **Component:** a reusable UI function.
- **JSX:** a readable way to describe UI.
- **Props:** inputs passed from parent to child.
- **Composition:** building a big screen from smaller pieces.
- **Children:** content placed inside a component.
- **Single responsibility:** one component should have one clear main job.

## Practice

1. Create a PetStatus component that receives status and returns LIVE or LOST.
2. Extract one summary card from a page into a reusable component.
3. Pass a color as a prop instead of hardcoding it.
4. Pass an onSelect function from a parent to a child.
5. Draw which component owns data and which component only displays it.

## Mini challenge

Make a reusable AlertRow with these props:

~~~text
title
time
severity
onOpen
~~~

The row should display the title and call onOpen when clicked.

## Check your work

You are ready when you can explain why a prop is different from state and why a list item needs a key.

