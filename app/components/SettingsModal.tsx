"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { TimerSettings } from "./PomodoroTimer";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimerSettings;
  onSave: (settings: TimerSettings) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<TimerSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/90 p-4 backdrop-blur-2xl animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl animate-scaleIn border border-white/5">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Timer Settings</h2>
          <button
            onClick={handleCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-on-surface-variant transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface-variant">
              Work Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.work}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  work: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)),
                })
              }
              className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface-variant">
              Short Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={localSettings.shortBreak}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  shortBreak: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)),
                })
              }
              className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface-variant">
              Long Break Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.longBreak}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  longBreak: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)),
                })
              }
              className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-outline-variant py-3 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-primary-container py-3 font-medium text-on-primary-container transition-colors hover:bg-primary-container/80"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
