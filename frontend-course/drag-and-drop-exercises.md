# Drag-and-drop exercises

These exercises help you order the real FiruApp execution path. If your learning platform supports drag and drop, move the cards. If not, write the cards on paper and reorder them.

After you try each one, check the answer and explain why the order is correct.

## Exercise 1: application startup

**Goal:** place the startup pieces in execution order.

Cards:

~~~text
A. App
B. public/index.html
C. BrowserRouter
D. ReactDOM.createRoot
E. Routes
~~~

Answer:

~~~text
B -> D -> C -> A -> E
~~~

Why: the browser reads HTML, React creates a root, the router wraps App, and App returns Routes.

## Exercise 2: login

**Goal:** place the login actions in order.

Cards:

~~~text
A. save token
B. preventDefault
C. POST /api/auth/login
D. setLoading(true)
E. navigate to /owner-dashboard
F. setLoading(false)
~~~

Answer:

~~~text
B -> D -> C -> A -> E -> F
~~~

Why: stop the browser form reload, show work, request the token, save identity, navigate, and finish the loading state.

## Exercise 3: React state loop

**Goal:** show how a list click changes the selected pet.

Cards:

~~~text
A. selectedPet is calculated
B. user clicks a pet row
C. React renders again
D. setSelectedPetId(pet.id)
E. selected detail panel changes
~~~

Answer:

~~~text
B -> D -> C -> A -> E
~~~

Why: the event calls the setter, the setter causes a new render, then derived data and the screen change.

## Exercise 4: database pets

**Goal:** order the first dashboard request.

Cards:

~~~text
A. mapPetDtoToDashboardPet
B. useEffect calls load
C. setDatabasePets
D. GET /api/pets
E. extractPetDtos
~~~

Answer:

~~~text
B -> D -> E -> A -> C
~~~

Why: the effect starts the loader, the response is unwrapped, each DTO is adapted, and the result enters state.

## Exercise 5: child to parent

**Goal:** follow a location update.

Cards:

~~~text
A. FiruappDashboard stores petLocations
B. FiruappMapView normalizes locations
C. location request returns
D. onLocationsChange is called
E. parent-derived values update
~~~

Answer:

~~~text
C -> B -> D -> A -> E
~~~

Why: the map receives raw data, turns it into a stable shape, sends it upward, and the parent recalculates its view.

## Exercise 6: selected pet

**Goal:** order the values used by the details panel.

Cards:

~~~text
A. selectedPetBattery is calculated
B. selectedPetId changes
C. selectedPet is found
D. selectedPetLocation is found
E. detail panel renders
~~~

Answer:

~~~text
B -> C -> D -> A -> E
~~~

Why: the ID identifies a pet, the location is matched to it, then battery and other details are calculated.

## Exercise 7: route navigation

**Goal:** follow Create Geofence from the pet menu.

Cards:

~~~text
A. App matches /geofence
B. user selects Create Geofence
C. navigate adds petId to the URL
D. DashboardLayout renders
E. Outlet renders CustomGeofence
~~~

Answer:

~~~text
B -> C -> A -> D -> E
~~~

Why: the event changes the URL, the router matches the route, the layout appears, and the child fills the Outlet.

## Exercise 8: map marker

**Goal:** order what happens when a marker is clicked.

Cards:

~~~text
A. onSelectPet receives the dashboard ID
B. Marker click handler runs
C. selectedPetId changes in the parent
D. selected details render
E. Leaflet marker is visible
~~~

Answer:

~~~text
E -> B -> A -> C -> D
~~~

Why: a visible marker receives a click, calls the parent callback, and updates shared state.

## Exercise 9: native drag and drop

**Goal:** order browser drag events.

Cards:

~~~text
A. setItems(newOrder)
B. onDragStart stores the dragged ID
C. onDragOver calls preventDefault
D. onDrop receives the target ID
E. create a copied array and move the item
~~~

Answer:

~~~text
B -> C -> D -> E -> A
~~~

Why: the browser must know what is being moved, the target must allow a drop, and the drop creates a new immutable order.

## Exercise 10: debugging

**Goal:** use a calm debugging order.

Cards:

~~~text
A. inspect API response
B. check route
C. inspect derived filter
D. check event handler
E. inspect state
F. inspect CSS
~~~

Answer:

~~~text
B -> D -> E -> A -> C -> F
~~~

Why: first prove the correct component is running, then follow the value from the event through state and data before changing styles.

## Build one exercise in React

The folder examples contains a reusable DragDropExercise component. It accepts:

~~~text
title
cards
correctOrder
~~~

Example data:

~~~jsx
const startupCards = [
  { id: "html", label: "public/index.html" },
  { id: "root", label: "createRoot" },
  { id: "router", label: "BrowserRouter" },
  { id: "app", label: "App" },
  { id: "routes", label: "Routes" },
];

<DragDropExercise
  title="Order application startup"
  cards={startupCards}
  correctOrder={["html", "root", "router", "app", "routes"]}
/>
~~~

The component includes Move up and Move down buttons as well as dragging. That gives keyboard users another way to solve the exercise.

## Exercise rule

Do not look at the answer first. Make a guess, explain the guess, then verify it by reading the source file.

