"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { PomodoroTimer, type TimerSettings } from "./components/PomodoroTimer";
import { SettingsModal } from "./components/SettingsModal";
import { TaskManager } from "./components/TaskManager";
import type { Task } from "./components/TaskModal";

export default function Home() {
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Review project requirements", status: "todo" },
    { id: "2", title: "Set up development environment", status: "inprogress" },
    { id: "3", title: "Create initial design mockups", status: "complete" },
  ]);

  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      status: "todo",
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTaskStatus = (id: string, status: Task["status"]) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between px-8 py-6">
        <h1 className="text-xl font-bold tracking-tighter text-white">
          Luminous Deep
        </h1>
        <button
          className="text-on-surface-variant hover:text-white transition-colors"
          aria-label="User profile"
        >
          <User className="h-6 w-6" />
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 -mt-12">
        <PomodoroTimer
          settings={timerSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={timerSettings}
        onSave={setTimerSettings}
      />

      <TaskManager
        tasks={tasks}
        onAddTask={handleAddTask}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
