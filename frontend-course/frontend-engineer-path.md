# Frontend engineer path for FiruApp

This path is about abilities. Learn a tool when the product problem needs it.

## Stage 0: Web foundations

Learn HTML structure, CSS box model, flexbox, grid, responsive rules, JavaScript values, arrays, objects, functions, events, and promises.

**FiruApp milestone:** explain public/index.html, the root element, and the global CSS imported by src/index.js.

**Proof:** build one static pet card with HTML and CSS.

## Stage 1: React mental model

Learn that components are functions, JSX describes UI, props are inputs, and rendering is a calculation from current values.

**FiruApp milestone:** extract a PetRow component from the pet list.

**Proof:** draw the component tree and say which values move down through props.

## Stage 2: State and events

Learn state, setters, click events, controlled inputs, immutable updates, and the render loop.

**FiruApp milestone:** select one pet from both the map and the list with one selectedPetId.

**Proof:** explain:

~~~text
event -> setter -> new state -> render -> changed screen
~~~

## Stage 3: Remote data

Learn HTTP requests, Axios, loading and error states, authentication headers, effects, cleanup, and stale-request protection.

**FiruApp milestone:** explain fetchDatabasePets, the location polling interval, and the WebSocket cleanup.

**Proof:** replace the API with a small local array and then reconnect the real endpoint.

## Stage 4: Data modeling

Learn DTOs, adapters, stable IDs, optional fields, fallbacks, normalization, and avoiding duplicate sources of truth.

**FiruApp milestone:** write a small function that maps an API pet to a UI pet with id, name, status, and optional location.

**Proof:** the UI survives missing image, city, battery, or timestamp values.

## Stage 5: Navigation and product flows

Learn Route, Link, Navigate, Outlet, active navigation, query parameters, public pages, and protected pages.

**FiruApp milestone:** add the missing /alerts route and make sidebar navigation match the route table.

**Proof:** refresh a deep URL and identify which component should render.

## Stage 6: Integrations

Learn third-party component context, Leaflet markers, popups, map effects, geofences, protected images, and WebSocket messages.

**FiruApp milestone:** make one map control work and keep marker selection synchronized with the pet list.

**Proof:** decide whether an integration bug belongs in React state, the library state, the API data, or CSS.

## Stage 7: Responsive and accessible UI

Learn mobile-first layout, keyboard focus, labels, button versus link semantics, alt text, color contrast, and useful empty states.

**FiruApp milestone:** make filters usable on a narrow screen and give every icon-only action an accessible label.

**Proof:** use the app with a keyboard only.

## Stage 8: Quality and maintainability

Learn small components, custom hooks, tests for behavior, focused error messages, logging, code review, and refactoring without changing behavior.

**FiruApp milestone:** replace the stale default test with a test for pet selection or filter behavior.

**Proof:** another developer can run the app and safely change one feature.

## Stage 9: Delivery

Learn environment variables, production builds, API origins, CORS, native Capacitor differences, commits, review notes, and deployment checks.

**FiruApp milestone:** run npm run build, explain REACT_APP_API_URL, and test the browser and native build.

**Proof:** ship a small feature with a change summary and test evidence.

## Skill checklist

### JavaScript

- [ ] I can use map, filter, find, and reduce.
- [ ] I understand object spread and immutable updates.
- [ ] I can read an async function.
- [ ] I can handle missing values.

### React

- [ ] I can create a component.
- [ ] I can pass props.
- [ ] I can choose state versus derived data.
- [ ] I can use an effect with correct dependencies.
- [ ] I can render a list with stable keys.

### UI

- [ ] I handle loading, empty, error, and ready states.
- [ ] I use buttons for actions and links for navigation.
- [ ] I provide labels and alt text.
- [ ] I check phone and desktop widths.

### Engineering

- [ ] I can trace a bug from URL to handler.
- [ ] I can separate API mapping from visual rendering.
- [ ] I can write a focused test.
- [ ] I can explain my change to another engineer.

## Suggested rhythm

1. Read one lesson.
2. Trace the matching FiruApp code.
3. Make one small change.
4. Test it.
5. Write a three-sentence explanation.

The goal is not to memorize React names. The goal is to make the screen predictable.
