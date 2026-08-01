import React, { useState } from 'react';
import { Note } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface NotesViewProps {
  notes: Note[];
  onUpdate: (notes: Note[]) => void;
}

export function NotesView({ notes, onUpdate }: NotesViewProps) {
  const [content, setContent] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newNote: Note = {
      id: generateId(),
      content,
      date: new Date().toISOString(),
    };

    onUpdate([newNote, ...notes]);
    setContent('');
  };

  const handleDelete = (id: string) => {
    onUpdate(notes.filter(n => n.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleAdd} className="surface-panel p-6 space-y-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Ideation Studio</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Ephemeral Thoughts</p>
          </div>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-colors"
          placeholder="Jot down thoughts, ideas, or reminders..."
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-500 transition-colors font-bold text-xs uppercase tracking-wider disabled:opacity-50"
            disabled={!content.trim()}
          >
            <Plus className="w-4 h-4" /> Save Note
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {notes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-500 dark:text-zinc-500 bg-zinc-50 dark:bg-[#141414] rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm italic">
            Your creative area is empty. Start writing!
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-zinc-50 dark:bg-[#141414] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:border-zinc-700 transition-colors group relative flex flex-col">
              <div className="flex-1 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-zinc-500 dark:text-zinc-500 text-xs italic mb-2">Drafted {format(new Date(note.date), 'MMM d, h:mm a')}</p>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all bg-white dark:bg-zinc-950 p-1.5 rounded-md"
                aria-label="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
