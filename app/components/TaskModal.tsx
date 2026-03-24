"use client";

import { useState } from "react";
import { X, Plus, Check, Trash2 } from "lucide-react";

export interface Task {
  id: string;
  title: string;
  status: "todo" | "inprogress" | "complete";
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (title: string) => void;
  onUpdateTaskStatus: (id: string, status: Task["status"]) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
}: TaskModalProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  if (!isOpen) return null;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const columns: { key: Task["status"]; title: string; color: string }[] = [
    { key: "todo", title: "To Do", color: "text-on-surface-variant" },
    { key: "inprogress", title: "In Progress", color: "text-primary" },
    { key: "complete", title: "Complete", color: "text-tertiary" },
  ];

  const getTasksByStatus = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status);

  const getNextStatus = (currentStatus: Task["status"]): Task["status"] | null => {
    if (currentStatus === "todo") return "inprogress";
    if (currentStatus === "inprogress") return "complete";
    return null;
  };

  const getPrevStatus = (currentStatus: Task["status"]): Task["status"] | null => {
    if (currentStatus === "complete") return "inprogress";
    if (currentStatus === "inprogress") return "todo";
    return null;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-surface/90 p-4 backdrop-blur-2xl animate-fadeIn">
      <div className="flex h-full max-h-[800px] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-surface-container shadow-2xl border border-white/5 animate-scaleIn">
        <div className="flex items-center justify-between border-b border-white/5 p-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Focus Workflow</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Organize your path to deep work</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-on-surface-variant transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/5 p-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new task..."
              className="flex-1 rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-3 font-medium text-on-primary-container transition-colors hover:bg-primary-container/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>

        <div className="flex flex-1 gap-6 overflow-x-auto bg-surface/30 p-8 md:gap-8">
          {columns.map((column) => (
            <div
              key={column.key}
              className="flex min-w-[300px] flex-1 flex-col gap-4"
            >
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className={`font-[family-name:var(--font-manrope)] text-xs font-bold uppercase tracking-widest ${column.color}`}>
                  {column.title} ({getTasksByStatus(column.key).length})
                </h3>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-auto">
                {getTasksByStatus(column.key).map((task, index) => (
                  <div
                    key={task.id}
                    className="group animate-slideUp rounded-2xl border border-white/5 bg-surface-container-high p-5 transition-all hover:border-primary/20"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`flex-1 text-sm leading-relaxed ${task.status === "complete" ? "text-on-surface-variant line-through decoration-white/20" : "font-medium text-white"}`}>
                        {task.title}
                      </p>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="rounded p-1 text-on-surface-variant opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {getPrevStatus(task.status) && (
                        <button
                          onClick={() =>
                            onUpdateTaskStatus(task.id, getPrevStatus(task.status)!)
                          }
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                        >
                          ← Back
                        </button>
                      )}
                      {getNextStatus(task.status) && (
                        <button
                          onClick={() =>
                            onUpdateTaskStatus(task.id, getNextStatus(task.status)!)
                          }
                          className="flex items-center gap-1 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30"
                        >
                          <Check className="h-3 w-3" />
                          {column.key === "todo" ? "Start" : "Complete"}
                        </button>
                      )}
                      {task.status === "complete" && (
                        <span className="rounded-lg bg-tertiary/20 px-3 py-1.5 text-xs font-medium text-tertiary">
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {getTasksByStatus(column.key).length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-outline-variant p-4">
                    <p className="text-sm text-on-surface-variant">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
