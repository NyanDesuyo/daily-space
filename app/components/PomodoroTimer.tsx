"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RefreshCw, Settings } from "lucide-react";

export type TimerMode = "work" | "shortBreak" | "longBreak";

export interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
}

interface PomodoroTimerProps {
  settings: TimerSettings;
  onOpenSettings: () => void;
}

export function PomodoroTimer({
  settings,
  onOpenSettings,
}: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeRemaining, setTimeRemaining] = useState(settings.work * 60);
  const [isRunning, setIsRunning] = useState(false);

  const getTotalTime = useCallback(() => {
    switch (mode) {
      case "work":
        return settings.work * 60;
      case "shortBreak":
        return settings.shortBreak * 60;
      case "longBreak":
        return settings.longBreak * 60;
    }
  }, [mode, settings]);

  useEffect(() => {
    setTimeRemaining(getTotalTime());
  }, [getTotalTime]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    switch (newMode) {
      case "work":
        setTimeRemaining(settings.work * 60);
        break;
      case "shortBreak":
        setTimeRemaining(settings.shortBreak * 60);
        break;
      case "longBreak":
        setTimeRemaining(settings.longBreak * 60);
        break;
    }
  };

  const handlePlayPause = () => {
    if (timeRemaining === 0) {
      setTimeRemaining(getTotalTime());
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(getTotalTime());
  };

  const getStatusText = () => {
    if (timeRemaining === 0) return "COMPLETED";
    if (isRunning) {
      switch (mode) {
        case "work":
          return "FOCUSING";
        case "shortBreak":
          return "SHORT BREAK";
        case "longBreak":
          return "LONG BREAK";
      }
    }
    return "PAUSED";
  };

  const modes: { key: TimerMode; label: string }[] = [
    { key: "work", label: "Work" },
    { key: "shortBreak", label: "Short Break" },
    { key: "longBreak", label: "Long Break" },
  ];

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-10">
      <div className="flex w-full max-w-sm rounded-full border border-white/5 bg-surface-container p-1.5">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => handleModeChange(m.key)}
            className={`flex-1 rounded-full py-2.5 font-[family-name:var(--font-manrope)] text-[10px] font-bold uppercase tracking-widest transition-all ${
              mode === m.key
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute -inset-12 rounded-full bg-primary/10 opacity-60 blur-[100px]"></div>
        <div className="relative flex h-72 w-72 flex-col items-center justify-center rounded-full border border-white/10 glass-panel timer-glow md:h-96 md:w-96">
          <span className="font-[family-name:var(--font-inter)] text-6xl font-black tracking-tighter text-white md:text-8xl">
            {formatTime(timeRemaining)}
          </span>
          <div className="mt-4 flex items-center gap-2 font-[family-name:var(--font-manrope)] text-[11px] font-bold uppercase tracking-[0.2em] text-tertiary">
            <span className="relative flex h-2 w-2">
              {isRunning && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-75"></span>
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isRunning ? "bg-tertiary" : "bg-on-surface-variant"
                }`}
              ></span>
            </span>
            {getStatusText()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <button
          onClick={handleReset}
          className="p-4 text-on-surface-variant transition-all hover:scale-110 hover:text-white active:scale-90"
          aria-label="Reset timer"
        >
          <RefreshCw className="h-8 w-8" />
        </button>

        <button
          onClick={handlePlayPause}
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-container text-on-primary-container shadow-2xl transition-all hover:scale-105 active:scale-95 md:h-24 md:w-24"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? (
            <Pause className="h-12 w-12 fill-current md:h-14 md:w-14" />
          ) : (
            <Play className="ml-1 h-12 w-12 fill-current md:h-14 md:w-14" />
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-4 text-on-surface-variant transition-all hover:scale-110 hover:text-white active:scale-90"
          aria-label="Open settings"
        >
          <Settings className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
}
