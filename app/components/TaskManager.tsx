"use client";

import { useState } from "react";
import { ChevronUp, ClipboardCheck } from "lucide-react";
import { TaskModal } from "./TaskModal";
import type { Task } from "./TaskModal";

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onUpdateTaskStatus: (id: string, status: Task["status"]) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskManager({
  tasks,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
}: TaskManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeTasksCount = tasks.filter(
    (t) => t.status === "todo" || t.status === "inprogress"
  ).length;

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full p-6 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group mx-auto flex w-full max-w-md items-center justify-between rounded-2xl border border-white/10 bg-surface-container-highest/90 p-4 shadow-2xl backdrop-blur-xl transition-all hover:bg-surface-container-highest"
          aria-label="Open task manager"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition-transform group-hover:scale-110">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">
                {activeTasksCount} Active Task{activeTasksCount !== 1 ? "s" : ""}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Open Kanban Board
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-2">
            <ChevronUp className="h-5 w-5 text-on-surface-variant transition-transform group-hover:translate-y-[-2px]" />
          </div>
        </button>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={tasks}
        onAddTask={onAddTask}
        onUpdateTaskStatus={onUpdateTaskStatus}
        onDeleteTask={onDeleteTask}
      />
    </>
  );
}
