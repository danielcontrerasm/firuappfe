# What really executes: the FiruApp dashboard

This is the code tour for the dashboard reached after a successful login in the Downloads copy of pet-tracker.

The best way to understand a frontend is to follow the execution path. Start with the HTML page, then follow imports, routes, state, effects, and events.

## 1. The browser creates a mount point

The browser reads public/index.html. The important element is:

~~~html
<div id="root"></div>
~~~

This is an empty place where React will put the application.

**Key concept: mount point**

A mount point is the HTML element where React takes control.

## 2. React starts in src/index.js

src/index.js imports React, ReactDOM, the router, the top-level App component, global CSS, and Leaflet CSS.

The important code is:

~~~jsx
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
~~~

Read it as:

> Find the root element and render App inside a router.

BrowserRouter makes the browser URL available to React Router.

## 3. src/App.js chooses the page

src/App.js returns a Routes tree. A route is a rule that connects a URL to a component.

The main rule is:

~~~jsx
<Route path="/owner-dashboard" element={<FiruappDashboard />} />
~~~

The public flow is:

~~~text
/ -> Navigate to /login
/login -> Login
/register -> Register
/owner-dashboard -> FiruappDashboard
~~~

The other pages are children of DashboardLayout, which adds a sidebar and an Outlet. The main dashboard is different: FiruappDashboard renders FiruappSidebar itself.

**Key concept: route matching**

React Router looks at the URL and renders the matching route element. A page does not need to be manually shown or hidden by the parent.

## 4. Login stores the token

src/components/Auth/Login.js owns the login form.

Its flow is:

1. useState stores the email, password, and loading state.
2. The form calls handleSubmit.
3. preventDefault stops a full browser reload.
4. Axios sends POST /api/auth/login.
5. The returned token is saved in localStorage.
6. A guide flag is saved in sessionStorage.
7. The browser navigates to /owner-dashboard.

Small version of the same idea:

~~~jsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

async function handleSubmit(event) {
  event.preventDefault();
  setLoading(true);

  try {
    const response = await axios.post(buildApiUrl("/api/auth/login"), {
      email,
      password,
    });

    localStorage.setItem("token", response.data.token);
    window.location.href = "/owner-dashboard";
  } finally {
    setLoading(false);
  }
}
~~~

**Key concept: authentication state**

The token is a small piece of information that lets later requests prove who the user is.

## 5. FiruappDashboard owns the page state

The active component is src/components/Dashboard/FiruappDashboard.tsx.

It imports:

- FiruappSidebar for navigation.
- FiruappMapView for locations, geofences, and markers.
- FiruappPetsList for the floating pet cards.
- Pet and color values from FiruappStyles.ts.
- Material UI components and icons.
- Axios for HTTP.
- SockJS and STOMP for live alerts.
- usePetImage for protected pet photos.
- runtime URL helpers.

The most important state values are:

| State | Meaning |
| --- | --- |
| dashboardPets | Pets currently used by the page |
| databasePets | Pets returned by GET /api/pets |
| petLocations | Live locations supplied by the map |
| petFilters | City, neighborhood, owner, and pet search values |
| selectedPetId | The pet whose detail panel is open |
| section | Sidebar section information |
| alertMessages | Live alerts received over WebSocket |
| alertsConnected | Whether the alert connection is active |
| cityByLocationKey | Reverse-geocoded city cache |
| guideOpen and guideStepIndex | Walkthrough state |

The component has a constant data mode:

~~~tsx
const petDataMode: PetDataMode = "database";
~~~

That tells the map to use database locations instead of local mock locations.

## 6. Pets load after the first render

fetchDatabasePets sends:

~~~text
GET /api/pets
~~~

It reads the token, builds the API URL, sends the authorization header, unwraps possible response shapes with extractPetDtos, and maps each DTO with mapPetDtoToDashboardPet.

The first effect calls it:

~~~jsx
useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      const loadedPets = await fetchDatabasePets();
      if (!cancelled) setDatabasePets(loadedPets);
    } catch (error) {
      if (!cancelled) setDatabasePets([]);
    }
  }

  load();
  return () => {
    cancelled = true;
  };
}, [fetchDatabasePets]);
~~~

The cancelled flag prevents an old request from updating state after the component has gone away.

Then another effect copies databasePets to dashboardPets and preserves the selected ID only when that ID still exists.

**Key concept: asynchronous data**

An HTTP request finishes later. The first render happens before the answer arrives, so the interface must be able to render an incomplete state.

## 7. Live locations come from the map component

The parent renders:

~~~jsx
<FiruappMapView
  pets={filteredDashboardPets}
  petDataMode={petDataMode}
  locationCity={selectedPetGpsCity}
  onSelectPet={setSelectedPetId}
  onLocationsChange={handleLocationsChange}
/>
~~~

FiruappMapView calls GET /api/pets/locations. It refreshes every 30 seconds:

~~~jsx
fetchPetLocations();
const interval = window.setInterval(fetchPetLocations, 30000);

return () => window.clearInterval(interval);
~~~

The map normalizes each location and sends the list back to the parent through onLocationsChange.

In the parent:

~~~jsx
const handleLocationsChange = useCallback((locations) => {
  setPetLocations(locations);
}, []);
~~~

This is a child-to-parent communication pattern: the parent gives a callback to the child, and the child calls it when data changes.

## 8. Live details are merged into database pets

The dashboard builds a lookup object from petLocations with useMemo. It can then overlay live name, owner, city, neighborhood, and battery information onto the database pet.

The important idea is:

~~~text
database pet + live location details
  -> one display pet
  -> filter by the current search fields
~~~

matchesPetFilters checks city, neighborhood, owner, and pet name. filteredDashboardPets is the list used by both the map and pet list.

This gives the page one visible answer to the question:

> Which pets should the user see right now?

## 9. WebSocket alerts run in a separate effect

Another effect creates a STOMP client using SockJS:

~~~jsx
const client = new Client({
  webSocketFactory: () => new SockJS(buildWsUrl("/ws")),
  reconnectDelay: 5000,
});

client.activate();

return () => {
  client.deactivate();
};
~~~

When connected, it subscribes to:

~~~text
/topic/alerts/1
~~~

Each message is put at the front of alertMessages, and the list is limited to five items.

**Key concept: cleanup**

An effect that opens a timer, WebSocket, or browser listener must close it when the component is removed.

## 10. The selected pet is calculated

The selected pet is not stored as a full object. The state stores only an ID:

~~~jsx
const selectedPet = useMemo(
  () =>
    filteredDashboardPets.find((pet) => pet.id === selectedPetId) ||
    filteredDashboardPets.find((pet) => pet.status === "lost") ||
    filteredDashboardPets[0],
  [filteredDashboardPets, selectedPetId]
);
~~~

This creates a priority:

1. Use the selected ID if it exists.
2. Otherwise show a lost pet.
3. Otherwise show the first pet.

From that selected pet, the component calculates location, last-seen text, city, battery color, and whether the pet is lost.

These values are **derived data**. They should not be stored separately unless there is a strong reason.

## 11. Reverse geocoding fills in a missing city

If the selected live location has coordinates but no city, the dashboard calls the Nominatim reverse-geocoding service.

The effect:

1. Builds a cache key from latitude and longitude.
2. Skips the request if the city is already cached.
3. Uses AbortController.
4. Fetches a city name.
5. Stores the result in cityByLocationKey.
6. Aborts the request during cleanup.

This is a real example of combining remote data with a cache and cancellation.

## 12. The render creates the visual hierarchy

The returned JSX has this structure:

~~~text
FiruappDashboard
├── FiruappSidebar
├── top search and account bar
├── greeting and filters
├── five summary cards
├── map panel
│   ├── FiruappMapView
│   └── FiruappPetsList
├── recent alerts panel
├── selected pet details panel
└── DashboardGuideOverlay
~~~

### Search

The top search input is controlled by petFilters.petName:

~~~jsx
<InputBase
  value={petFilters.petName}
  onChange={(event) =>
    setPetFilters((current) => ({
      ...current,
      petName: event.target.value,
    }))
  }
/>
~~~

The input does not keep its own hidden value. React owns the value.

### Filters

The city Select, neighborhood TextField, and owner TextField update different fields in one object:

~~~jsx
setPetFilters((current) => ({
  ...current,
  neighborhood: event.target.value,
}));
~~~

The spread operator keeps the other fields.

### Summary cards

SummaryCard is a reusable component. The dashboard uses it five times with different props:

~~~jsx
<SummaryCard label="Pets" value={filteredDashboardPets.length} />
<SummaryCard label="GPS Online" value={activePets.length} />
<SummaryCard label="Alerts" value={recentAlertItems.length} />
~~~

One component, different data.

### Map and list

Both children receive the same filtered pets. Both can select a pet by calling setSelectedPetId.

This is the shared-state pattern:

~~~text
parent owns selectedPetId
  -> parent passes selectedId to children
  -> child calls onSelect(id)
  -> parent changes state
  -> both children render again
~~~

### Recent alerts

recentAlertItems combines live WebSocket messages with lost pets and takes only two items for the compact panel.

### Selected pet panel

The detail panel appears only when selectedPet exists:

~~~jsx
{selectedPet && (
  <Paper>
    ...
  </Paper>
)}
~~~

This is conditional rendering.

## 13. The map goes one level deeper

FiruappMapView.tsx owns map-specific state:

| State | Purpose |
| --- | --- |
| petLocations | Normalized live markers |
| petGeofences | Circles and polygons |
| showGeofences | Hide or show geofences |
| mapStyle | Natural or clean map |
| petImageBlobUrls | Protected image URLs for markers |

Its data flow is:

~~~text
fetch locations
  -> normalize latitude, longitude, IDs, city, address, battery
  -> setPetLocations
  -> tell parent with onLocationsChange
  -> derive displayMarkers
  -> render MapContainer
~~~
The map uses MapContainer for the Leaflet map, TileLayer for map tiles, CenterMap for map movement, Circle and Polygon for geofences, Marker for pets, and Popup for details.
CenterMap calls useMap, then moves the map to the average location:
~~~jsx
const CenterMap = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    const averageLatitude = markers.reduce((sum, item) => sum + item.latitude, 0) / markers.length;
    const averageLongitude = markers.reduce((sum, item) => sum + item.longitude, 0) / markers.length;
    map.setView([averageLatitude, averageLongitude], 14);
  }, [markers, map]);
  return null;
};
~~~
It returns no visible HTML. Its job is to perform an effect inside the map context.
## 14. The pet list goes one level deeper
FiruappPetList.tsx receives pets, selectedId, onSelect, and callbacks for status changes.
It:
1. Renders every pet with map.
2. Uses pet.id as the React key.
3. Calls onSelect(pet.id) on click.
4. Opens a context menu on right-click.
5. Can navigate to a geofence or volunteer group.
6. Can call the backend to mark a pet lost or found.
7. Uses usePetImage to show a protected image or initial fallback.
The right-click status flow is:
~~~text
right-click pet
  -> save menu position and selected menu pet
  -> choose Mark as Lost
  -> POST /api/pets/:id/lost
  -> parent receives onStatusChange
  -> parent updates databasePets and dashboardPets
  -> list and detail panel show the new status
~~~
## 15. Small feature traces
### Selecting a pet
~~~text
click list card OR map marker
  -> onSelect(id)
  -> setSelectedPetId(id)
  -> selectedPet is recalculated
  -> detail panel changes
  -> map/list selected styling changes
~~~
### Typing a filter
~~~text
type in TextField
  -> event.target.value
  -> setPetFilters(previous => updated object)
  -> filteredDashboardPets is recalculated
  -> summary counts, map, list, and alerts change
~~~
### Changing map style
~~~text
click Map or Satellite
  -> setMapStyle("natural" or "clean")
  -> activeMapStyle changes
  -> TileLayer key changes
  -> new tile URL renders
~~~
### Toggling geofences
~~~text
click All pets chip
  -> setShowGeofences(previous => !previous)
  -> Circle and Polygon elements appear or disappear
~~~
### New live alert
~~~text
WebSocket message
  -> STOMP callback
  -> setAlertMessages(previous => [newAlert, ...previous])
  -> recentAlertItems changes
  -> alert card and count change
~~~
## 16. What to notice as an engineer
1. FiruappDashboard is a large component. It works, but it is a good future refactoring exercise.
2. databasePets and dashboardPets are mirrored state. A later improvement could derive one from the other or centralize updates.
3. FiruappMapView fetches locations independently while the parent fetches pets. Clear API contracts would simplify this relationship.
4. The sidebar includes /alerts, but App.js has no /alerts route in this copy. That is a useful routing bug exercise.
5. Several buttons such as View all, Find, and Open route are visual actions without complete behavior yet.
6. The default Create React App test still looks for learn react, so it no longer describes the product.
## Questions to answer without looking
1. Which file creates the root?
2. Which route renders the main dashboard?
3. Where is the token stored?
4. Which request loads database pets?
5. Which component refreshes locations every 30 seconds?
6. How does a child notify the parent about locations?
7. Which state identifies the selected pet?
8. Why is CenterMap a child of MapContainer?
9. Where are live alerts stored?
10. Which function filters pets?
If you can answer these in your own words, you understand the dashboard execution path.
