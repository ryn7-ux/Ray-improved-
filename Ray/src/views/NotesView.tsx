import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Note } from '../types';
import { generateId } from '../utils';
import { Sparkles, X, Trash2, Star, Compass, Map, Send, Navigation } from 'lucide-react';
import { format } from 'date-fns';

interface NotesViewProps {
  notes: Note[];
  onUpdate: (notes: Note[]) => void;
}

type Mode = 'constellation' | 'maze';

// --- Deterministic layout helpers -------------------------------------

// Simple string hash -> positive int, used to seed per-note pseudo-randomness
// so orb positions stay stable across re-renders.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Golden-angle phyllotaxis layout: gives an organic, even "constellation"
// spread without any two ideas ever colliding, no matter how many exist.
function orbPosition(index: number, total: number) {
  const goldenAngle = 137.50776;
  const angle = index * goldenAngle * (Math.PI / 180);
  const norm = total <= 1 ? 0 : index / total;
  const radius = 8 + norm * 40; // percent of container
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle) * 0.72; // flatten vertically for widescreen
  return { x: Math.min(94, Math.max(6, x)), y: Math.min(88, Math.max(12, y)) };
}

// --- Maze generation (recursive backtracker) ---------------------------

interface MazeCell {
  N: boolean; S: boolean; E: boolean; W: boolean;
  visited: boolean;
  noteId?: string;
}

function generateMaze(size: number, noteIds: string[]): MazeCell[][] {
  const grid: MazeCell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ N: true, S: true, E: true, W: true, visited: false }))
  );
  const stack: [number, number][] = [[0, 0]];
  grid[0][0].visited = true;
  const dirs: [number, number, keyof MazeCell, keyof MazeCell][] = [
    [0, -1, 'N', 'S'], [0, 1, 'S', 'N'], [1, 0, 'E', 'W'], [-1, 0, 'W', 'E'],
  ];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const options = dirs
      .map(([dx, dy, a, b]) => ({ nx: cx + dx, ny: cy + dy, a, b }))
      .filter(({ nx, ny }) => nx >= 0 && ny >= 0 && nx < size && ny < size && !grid[ny][nx].visited);
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(Math.random() * options.length)];
    (grid[cy][cx] as any)[pick.a] = false;
    (grid[pick.ny][pick.nx] as any)[pick.b] = false;
    grid[pick.ny][pick.nx].visited = true;
    stack.push([pick.nx, pick.ny]);
  }

  // Scatter ideas across open cells (excluding the entrance) so exploring
  // the labyrinth means genuinely rediscovering old thoughts.
  const cells: [number, number][] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!(x === 0 && y === 0)) cells.push([x, y]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  noteIds.forEach((id, i) => {
    if (cells[i]) {
      const [x, y] = cells[i];
      grid[y][x].noteId = id;
    }
  });

  return grid;
}

const MAZE_UNLOCK_THRESHOLD = 6;

export function NotesView({ notes, onUpdate }: NotesViewProps) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<Mode>('constellation');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [maze, setMaze] = useState<MazeCell[][] | null>(null);
  const [mazeSize, setMazeSize] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set(['0,0']));
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [notes]
  );

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    sortedNotes.forEach((n, i) => { map[n.id] = orbPosition(i, sortedNotes.length); });
    return map;
  }, [sortedNotes]);

  const mazeUnlocked = notes.length >= MAZE_UNLOCK_THRESHOLD;

  // --- Starfield backdrop (constellation mode) --------------------------
  useEffect(() => {
    if (mode !== 'constellation') return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let stars: { x: number; y: number; r: number; s: number; phase: number }[] = [];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const count = Math.floor((rect.width * rect.height) / 4500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r: Math.random() * 1.3 + 0.3,
        s: Math.random() * 0.015 + 0.004,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.35, 0,
        canvas.width * 0.5, canvas.height * 0.35, Math.max(canvas.width, canvas.height) * 0.7
      );
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.07)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const st of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * st.s + st.phase);
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 240, ${0.15 + tw * 0.55})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [mode]);

  // --- Maze setup ---------------------------------------------------------
  const enterMaze = () => {
    const size = Math.min(13, Math.max(7, Math.ceil(Math.sqrt(notes.length)) + 4));
    const m = generateMaze(size, notes.map(n => n.id));
    setMaze(m);
    setMazeSize(size);
    setPlayerPos({ x: 0, y: 0 });
    setVisited(new Set(['0,0']));
    setDiscovered(new Set());
    setMode('maze');
  };

  const exitMaze = () => setMode('constellation');

  // --- Maze keyboard movement ---------------------------------------------
  const handleMove = useCallback((dx: number, dy: number, dir: keyof MazeCell) => {
    setMaze(currentMaze => {
      if (!currentMaze) return currentMaze;
      setPlayerPos(pos => {
        const cell = currentMaze[pos.y]?.[pos.x];
        if (!cell || (cell as any)[dir]) return pos;
        const nx = pos.x + dx;
        const ny = pos.y + dy;
        if (nx < 0 || ny < 0 || nx >= mazeSize || ny >= mazeSize) return pos;
        const key = `${nx},${ny}`;
        setVisited(v => new Set(v).add(key));
        const landedCell = currentMaze[ny][nx];
        if (landedCell.noteId) {
          setDiscovered(d => {
            if (d.has(landedCell.noteId!)) return d;
            const next = new Set(d).add(landedCell.noteId!);
            return next;
          });
          const found = notes.find(n => n.id === landedCell.noteId);
          if (found) setTimeout(() => setSelectedNote(found), 120);
        }
        return { x: nx, y: ny };
      });
      return currentMaze;
    });
  }, [mazeSize, notes]);

  useEffect(() => {
    if (mode !== 'maze') return;
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); handleMove(0, -1, 'N'); }
      else if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); handleMove(0, 1, 'S'); }
      else if (['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); handleMove(-1, 0, 'W'); }
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); handleMove(1, 0, 'E'); }
      else if (e.key === 'Escape') exitMaze();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, handleMove]);

  // --- Maze canvas rendering ----------------------------------------------
  useEffect(() => {
    if (mode !== 'maze' || !maze) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) * 0.92;
    canvas.width = size;
    canvas.height = size;
    const cell = size / mazeSize;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        const key = `${x},${y}`;
        const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
        const isVisible = dist <= 1 || visited.has(key);
        if (!isVisible) continue;

        const px = x * cell;
        const py = y * cell;
        const c = maze[y][x];

        ctx.fillStyle = dist === 0 ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(px, py, cell, cell);

        ctx.strokeStyle = 'rgba(16,185,129,0.35)';
        ctx.lineWidth = Math.max(1.5, cell * 0.06);
        ctx.beginPath();
        if (c.N) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py); }
        if (c.S) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell); }
        if (c.W) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell); }
        if (c.E) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell); }
        ctx.stroke();

        if (c.noteId) {
          const found = notes.find(n => n.id === c.noteId);
          const isDiscovered = discovered.has(c.noteId);
          ctx.beginPath();
          ctx.arc(px + cell / 2, py + cell / 2, cell * 0.16, 0, Math.PI * 2);
          ctx.fillStyle = isDiscovered
            ? (found?.pinned ? '#f5c542' : '#10b981')
            : 'rgba(226,232,240,0.55)';
          ctx.shadowColor = isDiscovered ? (found?.pinned ? '#f5c542' : '#10b981') : 'transparent';
          ctx.shadowBlur = isDiscovered ? 14 : 0;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Player glyph
    const ppx = playerPos.x * cell + cell / 2;
    const ppy = playerPos.y * cell + cell / 2;
    ctx.save();
    ctx.translate(ppx, ppy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#e2f8ee';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 18;
    const r = cell * 0.22;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }, [mode, maze, mazeSize, playerPos, visited, discovered, notes]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const newNote: Note = { id: generateId(), content: content.trim(), date: new Date().toISOString() };
    onUpdate([newNote, ...notes]);
    setContent('');
    setJustAddedId(newNote.id);
    setTimeout(() => setJustAddedId(null), 900);
  };

  const handleDelete = (id: string) => {
    onUpdate(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  const togglePin = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    onUpdate(updated);
    setSelectedNote(prev => prev && prev.id === id ? { ...prev, pinned: !prev.pinned } : prev);
  };

  const discoveredCount = discovered.size;
  const totalMazeNotes = notes.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-zinc-900 dark:text-zinc-100 font-semibold text-2xl tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            The Nexus
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mt-1">
            {notes.length} {notes.length === 1 ? 'idea' : 'ideas'} suspended in thought-space
          </p>
        </div>

        {mode === 'constellation' ? (
          mazeUnlocked && (
            <button
              onClick={enterMaze}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/30"
            >
              <Compass className="w-4 h-4" /> Enter the labyrinth
            </button>
          )
        ) : (
          <button
            onClick={exitMaze}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-zinc-700"
          >
            <X className="w-4 h-4" /> Return to the nexus
          </button>
        )}
      </div>

      {!mazeUnlocked && notes.length > 0 && (
        <div className="surface-panel px-4 py-3 flex items-center gap-3">
          <Map className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Log {MAZE_UNLOCK_THRESHOLD - notes.length} more {MAZE_UNLOCK_THRESHOLD - notes.length === 1 ? 'idea' : 'ideas'} to unlock <span className="text-emerald-500 font-bold">The Labyrinth</span> — a maze built from your own thoughts.
          </p>
        </div>
      )}

      {/* Main stage */}
      <div
        ref={containerRef}
        className="relative w-full rounded-3xl border border-zinc-800/70 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, #0f1512 0%, #050505 70%)', minHeight: mode === 'maze' ? 560 : 460 }}
      >
        <canvas ref={canvasRef} className={mode === 'maze' ? 'absolute inset-0 m-auto' : 'absolute inset-0 w-full h-full'} />

        {mode === 'constellation' && (
          <>
            {/* Constellation connector lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {sortedNotes.map((n, i) => {
                if (i === 0) return null;
                const a = positions[sortedNotes[i - 1].id];
                const b = positions[n.id];
                if (!a || !b) return null;
                return (
                  <line
                    key={n.id}
                    x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
                    stroke="rgba(16,185,129,0.18)" strokeWidth={1} strokeDasharray="2 4"
                  />
                );
              })}
            </svg>

            {notes.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6" style={{ zIndex: 2 }}>
                <Sparkles className="w-8 h-8 text-emerald-600/60 mb-1" />
                <p className="text-zinc-400 text-sm">The void is empty. Your first thought becomes a star.</p>
              </div>
            ) : (
              sortedNotes.map((note, i) => {
                const pos = positions[note.id];
                const size = 56 + Math.min(28, note.content.length / 6);
                const isNew = justAddedId === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className="absolute rounded-full flex items-center justify-center text-left group"
                    style={{
                      left: `${pos.x}%`, top: `${pos.y}%`,
                      width: size, height: size,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 2,
                      animation: isNew
                        ? 'nexus-warp-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both, nexus-float 7s ease-in-out infinite 0.7s'
                        : `nexus-float ${6 + (hashString(note.id) % 5)}s ease-in-out infinite`,
                      animationDelay: isNew ? undefined : `-${hashString(note.id) % 6}s`,
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: note.pinned
                          ? 'radial-gradient(circle at 35% 30%, #fde9a8, #f5c542 55%, #8a6a12 100%)'
                          : 'radial-gradient(circle at 35% 30%, #a7f3d0, #10b981 55%, #065f46 100%)',
                        boxShadow: note.pinned
                          ? '0 0 22px 4px rgba(245,197,66,0.45)'
                          : '0 0 22px 4px rgba(16,185,129,0.4)',
                      }}
                    />
                    {note.pinned && (
                      <Star className="w-3.5 h-3.5 text-amber-900 fill-amber-900 absolute -top-1 -right-1 z-10 drop-shadow" />
                    )}
                    <span className="relative text-[10px] font-bold text-black/70 px-2 text-center leading-tight line-clamp-3">
                      {note.content.slice(0, 40)}
                    </span>
                  </button>
                );
              })
            )}
          </>
        )}

        {mode === 'maze' && maze && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4" style={{ zIndex: 2 }}>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-emerald-500" /> WASD / arrows to move</span>
              <span className="text-emerald-500">{discoveredCount} / {totalMazeNotes} ideas found</span>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      {mode === 'constellation' && (
        <form onSubmit={handleAdd} className="surface-panel p-4 flex items-end gap-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={2}
            className="flex-1 px-4 py-3 bg-black/30 border border-zinc-800 text-zinc-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-colors placeholder:text-zinc-600"
            placeholder="Transmit a new thought into the void..."
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl transition-colors font-bold text-xs uppercase tracking-wider disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" /> Cast
          </button>
        </form>
      )}

      {/* Detail panel */}
      {selectedNote && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedNote(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border p-6 relative"
            style={{
              animation: 'nexus-fade-up 0.25s ease-out both',
              background: 'linear-gradient(180deg, #121212 0%, #0a0a0a 100%)',
              borderColor: selectedNote.pinned ? 'rgba(245,197,66,0.4)' : 'rgba(16,185,129,0.3)',
              boxShadow: selectedNote.pinned ? '0 0 40px rgba(245,197,66,0.12)' : '0 0 40px rgba(16,185,129,0.12)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Drafted {format(new Date(selectedNote.date), 'MMM d, yyyy · h:mm a')}
              </p>
              <button onClick={() => setSelectedNote(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-zinc-200 text-base leading-relaxed whitespace-pre-wrap mb-6">{selectedNote.content}</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => togglePin(selectedNote.id)}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors ${
                  selectedNote.pinned ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700 hover:text-amber-400'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${selectedNote.pinned ? 'fill-amber-400' : ''}`} />
                {selectedNote.pinned ? 'Legendary idea' : 'Mark as legendary'}
              </button>
              <button
                onClick={() => handleDelete(selectedNote.id)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
