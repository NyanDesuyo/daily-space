"use client";

import { useState, useEffect, useRef } from "react";
import { User, Settings2, GripVertical } from "lucide-react";

export interface Task {
  id: string;
  text: string;
  status: "todo" | "in-progress" | "complete";
}

export interface TimerSettings {
  work: number;
  short: number;
  long: number;
}

const MODES = {
  WORK: "work" as const,
  SHORT: "short" as const,
  LONG: "long" as const,
};

export default function Home() {
  const [mode, setMode] = useState<"work" | "short" | "long">(MODES.WORK);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [settings, setSettings] = useState<TimerSettings>({
    work: 25,
    short: 5,
    long: 30,
  });
  const [showSettings, setShowSettings] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task["status"] | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch("/api/todos");
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error("Failed to fetch todos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTodos();
  }, []);

  const handleModeChange = (newMode: "work" | "short" | "long") => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(settings[newMode] * 60);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(settings[mode] * 60);
  };

  const saveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSettings = {
      work: parseInt(formData.get("work") as string) || 25,
      short: parseInt(formData.get("short") as string) || 5,
      long: parseInt(formData.get("long") as string) || 30,
    };
    setSettings(newSettings);
    setTimeLeft(newSettings[mode] * 60);
    setIsActive(false);
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTaskText, status: "todo" }),
      });
      if (response.ok) {
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
    setNewTaskText("");
  };

  const moveTask = async (id: string, newStatus: Task["status"]) => {
    const previousTasks = tasks;
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        setTasks(previousTasks);
      }
    } catch (error) {
      console.error("Failed to move task:", error);
      setTasks(previousTasks);
    }
  };

  const deleteTask = async (id: string) => {
    const previousTasks = tasks;
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setTasks(previousTasks);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      setTasks(previousTasks);
    }
  };

  const getTasksByStatus = (status: Task["status"]) => tasks.filter((t) => t.status === status);

  const getModeLabel = (m: string) => {
    if (m === "work") return "Work";
    if (m === "short") return "Short Break";
    return "Long Break";
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggedTaskId) {
      moveTask(draggedTaskId, status);
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  return (
    <div className="min-h-screen bg-surface font-sans">
      <header className="flex items-center justify-between px-6 py-6 md:px-8">
        <h1 className="text-xl font-bold tracking-tighter text-white">Luminous Deep</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Settings2 size={22} />
          </button>
          <button className="text-on-surface-variant hover:text-white transition-colors">
            <User className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-6 py-12 -mt-8">
        <div className="w-full max-w-md rounded-[2.5rem] bg-surface-container/50 backdrop-blur-md border border-white/5 p-8 text-center">
          <div className="flex bg-surface-container p-1.5 rounded-2xl mb-10">
            {([MODES.WORK, MODES.SHORT, MODES.LONG] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  mode === m
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {getModeLabel(m)}
              </button>
            ))}
          </div>

          <div className="mb-10">
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white">
              {formatTime(timeLeft)}
            </h1>
            <p className="text-on-surface-variant mt-3 font-medium uppercase tracking-widest text-[10px]">
              {mode === MODES.WORK ? "Deep Work Session" : "Rest & Recharge"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={resetTimer}
              className="p-4 rounded-2xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all active:scale-95 ${
                isActive ? "bg-surface-container-high" : "bg-primary-container"
              }`}
            >
              {isActive ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <div className="w-14" />
          </div>
        </div>

        <div className="mt-8 text-center text-on-surface-variant/60 text-sm max-w-xs">
          {isActive ? "Stay focused. You can do this!" : "Ready to start? Select your mode above."}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6">
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="mx-auto max-w-md w-full bg-surface-container-highest/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Task Overview</p>
              <p className="text-xs text-on-surface-variant">
                {getTasksByStatus("todo").length} To Do • {getTasksByStatus("in-progress").length} In Progress
              </p>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant group-hover:text-white transition-colors">
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)} />
          <div className="relative bg-surface-container w-full max-w-5xl h-full max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/5">
            <div className="p-6 bg-surface-container-high border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                Workspace Tasks
              </h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-on-surface-variant hover:text-white"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-x-auto p-6">
              <div className="flex flex-col md:flex-row gap-6 h-full min-w-[800px] md:min-w-0">
                {(["todo", "in-progress", "complete"] as const).map((status) => (
                  <div 
                    key={status} 
                    className={`flex-1 flex flex-col min-w-[280px] rounded-xl transition-all duration-200 ${
                      dragOverStatus === status ? "bg-primary/10 ring-2 ring-primary/50" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="uppercase text-xs font-black tracking-widest text-on-surface-variant">
                        {status.replace("-", " ")} ({getTasksByStatus(status).length})
                      </h3>
                      {status === "todo" && (
                        <div className="text-primary">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"/><path d="M12 5v14"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
                      {status === "todo" && (
                        <form onSubmit={addTask} className="mb-4">
                          <input
                            type="text"
                            placeholder="Add a new task..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            className="w-full bg-surface border border-outline-variant focus:border-primary focus:outline-none rounded-xl p-3 text-on-surface placeholder:text-on-surface-variant transition-all"
                          />
                        </form>
                      )}

{getTasksByStatus(status).map((task) => (
                        <div 
                          key={task.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`bg-surface-container-high p-4 rounded-xl border border-white/5 group cursor-grab active:cursor-grabbing transition-all ${
                            draggedTaskId === task.id ? "opacity-50 scale-95" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-2 items-center flex-1">
                              <div className="cursor-grab text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <button
                                onClick={() => moveTask(task.id, task.status === "complete" ? "todo" : "complete")}
                                className={`mt-0.5 shrink-0 transition-colors ${
                                  task.status === "complete" ? "text-tertiary" : "text-on-surface-variant hover:text-primary"
                                }`}
                              >
                                {task.status === "complete" ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                                  </svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                  </svg>
                                )}
                              </button>
                              <span className={`text-sm font-medium flex-1 ${task.status === "complete" ? "line-through text-on-surface-variant" : "text-white"}`}>
                                {task.text}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-400 transition-all"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                            {status !== "todo" && (
                              <button
                                onClick={() => moveTask(task.id, "todo")}
                                className="text-[10px] font-bold uppercase bg-surface px-2 py-1 rounded hover:bg-surface-container-high text-on-surface-variant transition-colors"
                              >
                                To Do
                              </button>
                            )}
                            {status !== "in-progress" && (
                              <button
                                onClick={() => moveTask(task.id, "in-progress")}
                                className="text-[10px] font-bold uppercase bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 text-primary transition-colors"
                              >
                                Progress
                              </button>
                            )}
                            {status !== "complete" && (
                              <button
                                onClick={() => moveTask(task.id, "complete")}
                                className="text-[10px] font-bold uppercase bg-tertiary/10 px-2 py-1 rounded hover:bg-tertiary/20 text-tertiary transition-colors"
                              >
                                Done
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {getTasksByStatus(status).length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-outline-variant rounded-2xl text-on-surface-variant text-xs italic">
                          No tasks here
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <form
            onSubmit={saveSettings}
            className="relative bg-surface-container w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-white/5"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Settings2 size={20} className="text-on-surface-variant" />
              Timer Settings
            </h3>

            <div className="space-y-4 mb-8">
              {[
                { id: "work", label: "Work Focus", val: settings.work },
                { id: "short", label: "Short Break", val: settings.short },
                { id: "long", label: "Long Break", val: settings.long },
              ].map((field) => (
                <div key={field.id} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase px-1">
                    {field.label} (mins)
                  </label>
                  <input
                    name={field.id}
                    type="number"
                    defaultValue={field.val}
                    min="1"
                    max="120"
                    className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 font-bold bg-primary-container text-on-primary-container rounded-xl shadow-lg hover:bg-primary-container/80 transition-all"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
