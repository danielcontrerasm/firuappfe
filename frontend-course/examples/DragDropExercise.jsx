import React, { useMemo, useState } from "react";

function moveItem(items, fromIndex, toIndex) {
  const nextItems = items.slice();
  const movedItem = nextItems.splice(fromIndex, 1)[0];
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export default function DragDropExercise({ title, cards, correctOrder }) {
  const [items, setItems] = useState(cards);
  const [draggingId, setDraggingId] = useState(null);
  const [message, setMessage] = useState("");

  const isCorrect = useMemo(
    () => items.every((item, index) => item.id === correctOrder[index]),
    [items, correctOrder]
  );

  function moveTo(targetId) {
    if (!draggingId || draggingId === targetId) return;

    const fromIndex = items.findIndex((item) => item.id === draggingId);
    const toIndex = items.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) return;

    setItems(moveItem(items, fromIndex, toIndex));
    setDraggingId(null);
    setMessage("Card moved. Keep going.");
  }

  function moveByButton(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems(moveItem(items, index, targetIndex));
    setMessage("Card moved with the keyboard control.");
  }

  return (
    <section aria-labelledby="exercise-title">
      <h2 id="exercise-title">{title}</h2>
      <p>Drag cards into the order that matches the lesson.</p>

      <ol>
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDraggingId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => moveTo(item.id)}
            style={{
              padding: 12,
              marginBottom: 8,
              border: item.id === draggingId ? "2px dashed #0284c7" : "1px solid #cbd5e1",
              borderRadius: 8,
            }}
          >
            <span>{item.label}</span>
            <button
              type="button"
              onClick={() => moveByButton(index, -1)}
              disabled={index === 0}
            >
              Move up
            </button>
            <button
              type="button"
              onClick={() => moveByButton(index, 1)}
              disabled={index === items.length - 1}
            >
              Move down
            </button>
          </li>
        ))}
      </ol>

      <p role="status">{message}</p>
      {isCorrect && <strong>Correct order.</strong>}
    </section>
  );
}

