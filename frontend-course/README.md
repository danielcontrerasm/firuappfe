# FiruApp Frontend Engineer Course

This is a practical React and JavaScript course built from the real pet-tracker project in Downloads.

The goal is simple: learn frontend engineering by understanding and extending the dashboard that already exists. Each lesson starts with one idea, connects it to the real FiruApp code, and ends with a small task.

## First: understand this project

The Downloads copy is a mixed JavaScript and TypeScript React application:

- JavaScript starts the app in src/index.js and src/App.js.
- The active dashboard is TypeScript in src/components/Dashboard/FiruappDashboard.tsx.
- The map and pet list are separate TypeScript components.
- Material UI provides many visual building blocks.
- Leaflet and React Leaflet provide the map.
- Axios loads HTTP data.
- SockJS and STOMP receive live alert messages.

The course examples use JavaScript syntax first. The same ideas apply to the TypeScript files in the project.

## The real execution path

~~~text
public/index.html
  -> src/index.js
  -> BrowserRouter
  -> src/App.js
  -> /login
  -> src/components/Auth/Login.js
  -> POST /api/auth/login
  -> localStorage token
  -> /owner-dashboard
  -> src/components/Dashboard/FiruappDashboard.tsx
  -> database pets request
  -> FiruappMapView location request
  -> FiruappPetsList
  -> map, filters, alerts, and selected-pet details
~~~

Read 00-dashboard-execution.md first. It explains what really executes from the browser down to the smallest dashboard feature.

## How to run

From the project root:

~~~bash
npm install
npm run dev
~~~

Open the URL printed by Create React App. The login page needs a backend that accepts the login request. After login, the token is used by dashboard requests.

## Ten lessons

| Lesson | Main idea | Real project code |
| --- | --- | --- |
| 1. From browser to dashboard | Startup and route matching | src/index.js, src/App.js |
| 2. Components and JSX | Reusable visual pieces | FiruappDashboard.tsx |
| 3. State and events | Selection and interaction | dashboard state |
| 4. Effects and API calls | Data that arrives later | Axios and useEffect |
| 5. Shaping backend data | Adapters and safe UI values | DTO mapping |
| 6. Derived data and filters | Calculated values | useMemo, filters |
| 7. Lists and conditional UI | Repeat and choose UI | pet list and panels |
| 8. Routing and navigation | URLs and layouts | Link, Route, Outlet |
| 9. Leaflet and third-party UI | Map context and markers | FiruappMapView.tsx |
| 10. Drag and drop plus quality | Interactive ordering and delivery | native drag events |

Each lesson has:

1. A plain-language explanation.
2. A small example.
3. A connection to FiruApp.
4. Key concepts.
5. A practice task.

## Study loop

1. Read one lesson.
2. Open the referenced source file.
3. Say what value enters the component.
4. Change one small thing.
5. Refresh the browser.
6. Explain why the screen changed.

## Completion project

After Lesson 10, build one of these:

- A working alerts route.
- A filter for active and lost pets.
- A working map layers button.
- A last-refreshed label for live locations.
- A reorderable priority-pets list.

The feature is complete when it has clear state, usable empty and error behavior, keyboard-friendly actions, and a short test or manual test checklist.

## Important source-code note

The project contains older dashboard experiments. In this Downloads copy, the route in src/App.js is:

~~~jsx
<Route path="/owner-dashboard" element={<FiruappDashboard />} />
~~~

That means the main dashboard to study is FiruappDashboard.tsx, not the older OwnerDashboard.js files.

## Course files

- Dashboard execution trace: 00-dashboard-execution.md
- Frontend engineer path: frontend-engineer-path.md
- Drag-and-drop exercises: drag-and-drop-exercises.md
- Lesson 1: lessons/01-browser-to-dashboard.md
- Lesson 2: lessons/02-components-jsx-props.md
- Lesson 3: lessons/03-state-and-events.md
- Lesson 4: lessons/04-effects-and-api.md
- Lesson 5: lessons/05-shaping-backend-data.md
- Lesson 6: lessons/06-derived-data-and-filters.md
- Lesson 7: lessons/07-lists-and-conditional-ui.md
- Lesson 8: lessons/08-routing-and-navigation.md
- Lesson 9: lessons/09-leaflet-and-third-party-ui.md
- Lesson 10: lessons/10-drag-drop-and-quality.md
