# Lesson 9: Leaflet and third-party UI

## Goal

Learn how React works with a library that owns a map.

## In easy words

React renders components. Leaflet manages a map object. React Leaflet connects the two worlds.

Some Leaflet operations need the map instance. That is why CenterMap is rendered inside MapContainer and uses useMap.

## Basic map

~~~jsx
<MapContainer center={[6.2442, -75.5812]} zoom={14}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[6.2442, -75.5812]}>
    <Popup>Pet location</Popup>
  </Marker>
</MapContainer>
~~~

MapContainer creates the context. TileLayer draws tiles. Marker draws a location. Popup shows details.

## FiruApp map structure

FiruappMapView renders:

- MapContainer
- TileLayer
- CenterMap
- Circles and polygons for geofences
- Markers for pet locations
- Popups
- Chips and map style controls

The parent gives it filtered pets and selection callbacks.

## Map context

~~~jsx
function CenterMap({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) return;

    const lat = markers.reduce((sum, item) => sum + item.latitude, 0) / markers.length;
    const lng = markers.reduce((sum, item) => sum + item.longitude, 0) / markers.length;

    map.setView([lat, lng], 14);
  }, [markers, map]);

  return null;
}
~~~

CenterMap does not create visible markup. It performs an effect using a map instance from context.

## Marker events

FiruappMapView creates a marker and connects its click to the parent:

~~~jsx
<Marker
  position={[pet.latitude, pet.longitude]}
  eventHandlers={{
    click: () => onSelectPet?.(dashboardPetId),
  }}
>
  <Popup>{pet.petName}</Popup>
</Marker>
~~~

The user clicks the marker. The parent changes selectedPetId. The details panel changes.

## Coordinates need validation

An API may send strings or missing values. Convert and validate before rendering:

~~~js
function normalizeCoordinate(location) {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
}
~~~

Invalid coordinates should not be sent to Leaflet.

## Map styles and geofences

The map keeps mapStyle and showGeofences in state.

Changing map style changes the tile URL. Toggling showGeofences decides whether Circle and Polygon components are rendered.

This is normal React state controlling a third-party view.

## Key concepts

- **Context:** shared library data available to child components.
- **Third-party integration:** connect React state and library commands.
- **Marker:** a point on the map.
- **Geofence:** a circle or polygon that represents a safe area.
- **Normalization:** validate values before giving them to a library.
- **Effect:** synchronize the map object after React values change.

## Practice

1. Add a marker click that selects a pet.
2. Add a button that centers on the selected pet.
3. Add a map style toggle.
4. Hide and show geofences.
5. Display a helpful empty state when no coordinates exist.

## Mini challenge

Use the existing FiruappMapView to add a “last refresh” value that updates whenever locations are fetched.

## Check your work

You are ready when you can say which code belongs to React and which code belongs to Leaflet.

