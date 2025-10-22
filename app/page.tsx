"use client";

import { useEffect, useMemo, useState } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "agentic.todos.v1";

function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Page() {
  const [todos, setTodos] = useLocalStorageState<Todo[]>(STORAGE_KEY, []);
  const [filter, setFilter] = useState<Filter>("all");
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const remainingCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos]
  );

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    const now = Date.now();
    const todo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    setTodos([todo, ...todos]);
    setInput("");
  }

  function toggleTodo(id: string) {
    setTodos(
      todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
      )
    );
  }

  function deleteTodo(id: string) {
    setTodos(todos.filter((t) => t.id !== id));
  }

  function startEdit(id: string, text: string) {
    setEditingId(id);
    setEditingText(text);
  }

  function confirmEdit() {
    const text = editingText.trim();
    if (!editingId) return;
    if (!text) {
      deleteTodo(editingId);
    } else {
      setTodos(
        todos.map((t) => (t.id === editingId ? { ...t, text, updatedAt: Date.now() } : t))
      );
    }
    setEditingId(null);
    setEditingText("");
  }

  function clearCompleted() {
    setTodos(todos.filter((t) => !t.completed));
  }

  function toggleAll(toCompleted: boolean) {
    setTodos(todos.map((t) => ({ ...t, completed: toCompleted, updatedAt: Date.now() })));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTodo();
  }

  return (
    <div className="card">
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 className="h1" style={{ flex: 1 }}>Todos</h1>
        <button className="button" onClick={() => toggleAll(true)} title="Mark all completed">Complete all</button>
        <button className="button" onClick={() => toggleAll(false)} title="Mark all active">Uncomplete all</button>
      </header>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          className="input"
          placeholder="What needs to be done?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="New todo"
        />
        <button className="button primary" onClick={addTodo} aria-label="Add todo">Add</button>
      </div>

      {visibleTodos.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", margin: "24px 0" }}>
          No todos {filter !== "all" ? `in ${filter}` : "yet"}. Add one above.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {visibleTodos.map((t) => (
            <li key={t.id} className="todo-item">
              <input
                type="checkbox"
                className="checkbox"
                checked={t.completed}
                onChange={() => toggleTodo(t.id)}
                aria-label={t.completed ? "Mark active" : "Mark completed"}
              />

              {editingId === t.id ? (
                <input
                  className="input"
                  autoFocus
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={confirmEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit();
                    if (e.key === "Escape") { setEditingId(null); setEditingText(""); }
                  }}
                />
              ) : (
                <div
                  className={`todo-text ${t.completed ? "completed" : ""}`}
                  onDoubleClick={() => startEdit(t.id, t.text)}
                >
                  {t.text}
                </div>
              )}

              <div className="actions">
                <button className="button" onClick={() => startEdit(t.id, t.text)}>Edit</button>
                <button className="button danger" onClick={() => deleteTodo(t.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="toolbar">
        <div className="muted">{remainingCount} items left</div>
        <div className="filters">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`filter ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="button" onClick={clearCompleted}>Clear completed</button>
      </div>

      <div className="footer">Built with Next.js on Vercel</div>
    </div>
  );
}
