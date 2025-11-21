"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  tags: string[];
  archived: boolean;
  password?: string;
  createdAt: number;
  updatedAt: number;
  theme: "light" | "dark";
}

const STORAGE_KEY = "notes-app-notes";

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Load notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setNotes(JSON.parse(stored));
    }
  }, []);

  // Persist notes to localStorage
  useEffect(() => {
    if (autosaveEnabled) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, autosaveEnabled]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const addNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      title: "Untitled",
      content: "",
      pinned: false,
      tags: [],
      archived: false,
      theme: "light",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setEditingNote(newNote);
  };

  const applyFormatting = (id: string, type: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        let newContent = n.content;
        switch (type) {
          case "bold":
            newContent = `<b>${newContent}</b>`;
            break;
          case "italic":
            newContent = `<i>${newContent}</i>`;
            break;
          case "underline":
            newContent = `<u>${newContent}</u>`;
            break;
          case "bullet":
            newContent = `<ul><li>${newContent}</li></ul>`;
            break;
          default:
            break;
        }
        return { ...n, content: newContent, updatedAt: Date.now() };
      })
    );
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNote?.id === id) setEditingNote(null);
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const toggleArchive = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: !n.archived } : n))
    );
  };

  const filteredNotes = notes
    .filter((n) => !n.archived)
    .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div className="relative flex flex-col h-full">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          variant="outline"
          aria-label="Toggle theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </Button>
        <Button
          onClick={() => setAutosaveEnabled(!autosaveEnabled)}
          variant="outline"
          aria-label="Toggle autosave"
        >
          {autosaveEnabled ? "🛑" : "▶️"}
        </Button>
      </div>

      {/* Search bar */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Notes list */}
        <aside className="w-80 border-r border-input overflow-y-auto p-4">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-2 mb-2 rounded cursor-pointer hover:bg-muted"
              onClick={() => setEditingNote(note)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{note.title}</span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(note.id);
                    }}
                    className="p-1 rounded hover:bg-muted/80"
                    aria-label="Pin note"
                  >
                    {note.pinned ? "📌" : "📍"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleArchive(note.id);
                    }}
                    className="p-1 rounded hover:bg-muted/80"
                    aria-label="Archive note"
                  >
                    🗄️
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {note.content.slice(0, 60)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(note.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
          <button
            onClick={addNote}
            className="mt-4 w-full p-2 rounded bg-primary text-primary-foreground hover:bg-primary/80"
          >
            + New Note
          </button>
        </aside>

        {/* Editor */}
        <main className="flex-1 p-4 overflow-y-auto">
          {editingNote ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) =>
                  updateNote(editingNote.id, { title: e.target.value })
                }
                className="w-full p-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Title"
              />
              <select
                value={editingNote.theme || "light"}
                onChange={(e) =>
                  updateNote(editingNote.id, { theme: e.target.value as "light" | "dark" })
                }
                className="w-full p-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
              </select>
              <div className="flex space-x-2 mb-2">
                <Button
                  onClick={() => applyFormatting(editingNote.id, "bold")}
                  variant="outline"
                  aria-label="Bold"
                >
                  <b>B</b>
                </Button>
                <Button
                  onClick={() => applyFormatting(editingNote.id, "italic")}
                  variant="outline"
                  aria-label="Italic"
                >
                  <i>I</i>
                </Button>
                <Button
                  onClick={() => applyFormatting(editingNote.id, "underline")}
                  variant="outline"
                  aria-label="Underline"
                >
                  <u>U</u>
                </Button>
                <Button
                  onClick={() => applyFormatting(editingNote.id, "bullet")}
                  variant="outline"
                  aria-label="Bullet List"
                >
                  •
                </Button>
              </div>
              <textarea
                value={editingNote.content}
                onChange={(e) =>
                  updateNote(editingNote.id, { content: e.target.value })
                }
                className="w-full h-64 p-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your note..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => deleteNote(editingNote.id)}
                  variant="destructive"
                  aria-label="Delete note"
                >
                  Delete
                </Button>
                <Button
                  onClick={() => setEditingNote(null)}
                  variant="outline"
                  aria-label="Close editor"
                >
                  Close
                </Button>
                <Button
                  onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))}
                  variant="outline"
                  aria-label="Save notes"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Select a note to edit.</p>
          )}
        </main>
      </div>
    </div>
  );
}
