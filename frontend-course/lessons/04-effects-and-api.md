# Lesson 4: Effects and API calls

## Goal

Learn how the dashboard loads information that is not available during the first render.

## In easy words

Rendering should calculate UI. An API request is work outside that calculation. React gives us useEffect for work that happens after rendering.

## Small example

~~~jsx
function PetCount() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPets() {
      try {
        const response = await axios.get("/api/pets");
        if (!cancelled) setPets(response.data);
      } catch (requestError) {
        if (!cancelled) setError("Could not load pets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPets();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  return <p>{pets.length} pets</p>;
}
~~~

The empty dependency array means this effect starts after the first mount.

## FiruApp database request

FiruappDashboard uses fetchDatabasePets and an effect:

~~~text
render
  -> effect runs
  -> GET /api/pets
  -> extractPetDtos
  -> mapPetDtoToDashboardPet
  -> setDatabasePets
  -> render with pets
~~~

The cleanup flag prevents a request from changing state after the component is no longer active.

## Polling

FiruappMapView calls the location endpoint immediately and then every 30 seconds.

A timer is an external resource. It must be removed:

~~~jsx
const interval = window.setInterval(fetchPetLocations, 30000);

return () => window.clearInterval(interval);
~~~

Without cleanup, old timers can keep running after navigation.

## WebSocket effect

The dashboard also opens a STOMP connection. It subscribes to live alerts and deactivates the client during cleanup.

The same rule applies to:

- timers
- WebSocket connections
- browser event listeners
- subscriptions
- object URLs

## Why useCallback appears

The dashboard wraps fetchDatabasePets in useCallback. That gives the function a stable identity while its dependencies do not change. The effect can safely list that function in its dependency array.

A simple rule:

> If an effect uses a function from the component, either define the function inside the effect or make its identity stable and list it as a dependency.

## Key concepts

- **Effect:** work after a render.
- **Dependency array:** values that decide when an effect runs again.
- **Cleanup:** code that closes external work.
- **Loading state:** tells the user work is in progress.
- **Error state:** tells the user work failed.
- **Polling:** repeating a request on a timer.
- **WebSocket:** a long-lived connection for live messages.

## Practice

1. Add a loading message to a fake pet request.
2. Add an error message when the request rejects.
3. Add a refresh button that calls the same loader.
4. Add cleanup to a timer.
5. Explain why an effect should not update state forever on every render.

## Mini challenge

Build a usePets hook that returns:

~~~text
pets
loading
error
reload
~~~

Use it in a small page.

## Check your work

You are ready when you can explain what happens if the API is slow, fails, or returns after the user leaves the page.

