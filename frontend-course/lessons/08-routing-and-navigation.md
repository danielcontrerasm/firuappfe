# Lesson 8: Routing and navigation

## Goal

Understand how URLs connect the dashboard to the rest of the product.

## In easy words

A URL is application state that users can bookmark, refresh, and share.

React Router gives the app tools for declaring routes and moving between them.

## Main route example

~~~jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/owner-dashboard" element={<FiruappDashboard />} />
  <Route path="/pets" element={<PetsListPage />} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
~~~

The router renders the element whose path matches the current URL.

## Link versus navigate

Use Link when the user is moving to another page:

~~~jsx
<Link to="/pets">My pets</Link>
~~~

Use navigate when code decides to move after an action:

~~~jsx
const navigate = useNavigate();

function openGeofence(petId) {
  navigate("/geofence?petId=" + petId);
}
~~~

The pet list uses navigate for geofence and volunteer group actions.

## Layout routes and Outlet

The route group in App.js uses DashboardLayout:

~~~jsx
<Route element={<DashboardLayout />}>
  <Route path="/geofence" element={<CustomGeofence />} />
  <Route path="/pets" element={<PetsListPage />} />
</Route>
~~~

DashboardLayout renders FiruappSidebar and Outlet. Outlet is the place where the matched child page appears.

The owner dashboard is outside that group because FiruappDashboard renders its own sidebar.

## A real bug exercise

FiruappSidebar includes a link to /alerts. App.js does not currently declare an /alerts route. The catch-all route sends an unknown path to /login.

This is a useful lesson:

> A visible navigation item and a route declaration must agree.

## Protected routes

This project stores a token, but it does not centralize route protection. A future ProtectedRoute could check the token before rendering private pages.

Small example:

~~~jsx
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
~~~

In a real app, the backend must still authorize every request. Hiding a page is not security by itself.

## Key concepts

- **Route:** URL-to-component rule.
- **Link:** navigation rendered as a link.
- **Navigate:** redirect component.
- **useNavigate:** navigation from event code.
- **Outlet:** child route location inside a layout.
- **Protected route:** route that checks identity before rendering.

## Practice

1. Add an /alerts route.
2. Add an AlertsPage component.
3. Make the sidebar link work.
4. Add a protected wrapper to the owner dashboard.
5. Add a query parameter for a selected pet.

## Mini challenge

Trace this action:

~~~text
right-click a pet
  -> choose Create Geofence
  -> navigate("/geofence?petId=...")
  -> App matches /geofence
  -> DashboardLayout renders
  -> Outlet renders CustomGeofence
~~~

## Check your work

You are ready when you can explain why clicking a Link changes the page without a full browser reload and why a refresh still needs a route that can be matched.

