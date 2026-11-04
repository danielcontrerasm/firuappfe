# Lesson 5: Shaping backend data

## Goal

Learn why frontend code converts backend responses before rendering them.

## In easy words

The backend and the screen have different jobs. The backend may use fields such as race, owner, or batteryLevel. The screen needs stable values such as breed, ownerName, and battery.

An adapter translates one shape into another.

## Small example

Backend response:

~~~js
{
  id: 7,
  name: "Luna",
  race: "Beagle",
  owner: { name: "Camila" },
  batteryLevel: 0.72
}
~~~

UI model:

~~~js
{
  id: "db-7",
  apiId: "7",
  name: "Luna",
  breed: "Beagle",
  ownerName: "Camila",
  battery: 72
}
~~~

Adapter:

~~~js
function mapPetDtoToPet(dto) {
  return {
    id: "db-" + dto.id,
    apiId: String(dto.id),
    name: dto.name || "Unnamed pet",
    breed: dto.race || dto.type || "Tracked pet",
    ownerName: dto.ownerName || dto.owner?.name || "",
    battery: dto.batteryLevel == null
      ? undefined
      : Math.round(dto.batteryLevel * 100),
  };
}
~~~

The render can now use one predictable shape.

## FiruApp database adapter

FiruappDashboard uses mapPetDtoToDashboardPet. It creates:

- a display ID
- an API ID
- a safe name
- active or lost status
- owner and location fields
- breed, age, and weight text
- battery, signal, speed, and last-seen values

It also uses extractPetDtos because the backend response may be an array or may be wrapped in content, items, pets, data, results, rows, or payload.

## Location normalization

FiruappMapView normalizes:

- latitude and longitude
- pet ID and name
- image URL
- owner name
- timestamp
- address
- city and neighborhood
- battery from different possible field names

It rejects locations that do not have valid coordinates.

## Safe defaults

A UI should survive optional data:

~~~jsx
<p>{pet.name || "Unnamed pet"}</p>
<p>{pet.battery == null ? "--%" : pet.battery + "%"}</p>
<p>{pet.city || "Unknown city"}</p>
~~~

A fallback is not hiding a bug. It is a decision about what the user should see when data is incomplete.

## Key concepts

- **DTO:** data transfer object from an API.
- **Adapter:** function that converts one data shape to another.
- **Normalization:** making different inputs look the same.
- **Stable ID:** an ID that does not change between renders.
- **Fallback:** a safe value for missing information.
- **Validation:** checking that a value is usable before rendering it.

## Practice

1. Write an adapter for a pet with three possible name fields.
2. Convert a battery value from 0.8 to 80.
3. Reject a location with a non-number latitude.
4. Add a missing-photo fallback.
5. Create a test object with the response wrapped in data.

## Mini challenge

Create a normalizeLocation function that always returns:

~~~text
id
petId
latitude
longitude
petName
batteryPercent
~~~

Return null when coordinates are invalid.

## Check your work

You are ready when the visual components do not need to know every possible backend field name.

