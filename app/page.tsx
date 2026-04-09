"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Settings2, BarChart2, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

type Mode = "work" | "shortBreak" | "longBreak";

interface Settings {
  work: number;
  shortBreak: number;
  longBreak: number;
}

interface DailyRecord {
  id: string;
  date: string;
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function Home() {
  const [settings, setSettings] = useState<Settings>({ work: 25, shortBreak: 5, longBreak: 15 });
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [records, setRecords] = useState<DailyRecord[]>([]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const syncTimerState = useCallback(async (m: Mode, r: boolean, t: number) => {
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m, isRunning: r, timeLeft: t }),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleTimerComplete = useCallback(async (completedMode: Mode, totalSeconds: number) => {
    setIsRunning(false);
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }

    // Record time spent
    try {
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: completedMode, seconds: totalSeconds }),
      });
    } catch (e) {
      console.error("Failed to save record", e);
    }

    // Push stopped state
    await syncTimerState(completedMode, false, 0);
  }, [soundEnabled, syncTimerState]);

  // Sync state reference to use in setInterval
  const stateRef = useRef({ mode, timeLeft, isRunning, settings });
  useEffect(() => {
    stateRef.current = { mode, timeLeft, isRunning, settings };
  }, [mode, timeLeft, isRunning, settings]);

  // Load initial state
  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then(res => res.json()),
      fetch("/api/timer").then(res => res.json())
    ]).then(([settingsData, timerData]) => {
      if (settingsData && !settingsData.error) {
        setSettings({
          work: settingsData.work,
          shortBreak: settingsData.shortBreak,
          longBreak: settingsData.longBreak,
        });
      }

      if (timerData && !timerData.error) {
        setMode(timerData.mode as Mode);

        // Calculate drift if timer was running
        if (timerData.isRunning) {
          const lastUpdated = new Date(timerData.updatedAt).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
          const newTimeLeft = Math.max(0, timerData.timeLeft - elapsedSeconds);

          setTimeLeft(newTimeLeft);
          setIsRunning(true);

          if (newTimeLeft === 0) {
            handleTimerComplete(timerData.mode, timerData.timeLeft);
          }
        } else {
          setTimeLeft(timerData.timeLeft);
          setIsRunning(false);
        }
      }
    });
  }, [handleTimerComplete]);

  // Polling to sync state across devices and keep timer updated
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const { isRunning, mode, timeLeft } = stateRef.current;
      if (!isRunning) return; // Only sync actively if running

      try {
        await fetch("/api/timer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, isRunning, timeLeft }),
        });
      } catch (err) {
        console.error("Failed to sync timer", err);
      }
    }, 5000); // Sync every 5 seconds

    return () => clearInterval(syncInterval);
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimerComplete(stateRef.current.mode, stateRef.current.settings[stateRef.current.mode] * 60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, handleTimerComplete]);

  // Document Title update
  useEffect(() => {
    const modeLabels = { work: "Focus", shortBreak: "Short Break", longBreak: "Long Break" };
    document.title = `${formatTime(timeLeft)} - ${modeLabels[mode]}`;
  }, [timeLeft, mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    syncTimerState(mode, !isRunning, timeLeft);
  };

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    const newTime = settings[newMode] * 60;
    setTimeLeft(newTime);
    syncTimerState(newMode, false, newTime);
  };

  const saveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newSettings = {
      work: Number(fd.get("work")),
      shortBreak: Number(fd.get("shortBreak")),
      longBreak: Number(fd.get("longBreak")),
    };

    setSettings(newSettings);
    setShowSettings(false);

    // Update time if not running
    if (!isRunning) {
      setTimeLeft(newSettings[mode] * 60);
      syncTimerState(mode, false, newSettings[mode] * 60);
    }

    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
  };

  const loadStats = async () => {
    setShowStats(true);
    const res = await fetch("/api/records");
    if (res.ok) {
      setRecords(await res.json());
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Background based on mode
  const bgImage = mode === "work"
    ? "url('/assets/images/work.jpg')"
    : mode === "shortBreak"
    ? "url('/assets/images/short-break.jpg')"
    : "url('/assets/images/long-break.jpg')";

  const fallbackColor = mode === "work" ? "#1e1e2f" : mode === "shortBreak" ? "#172a3a" : "#1a365d";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative transition-all duration-1000 bg-cover bg-center"
      style={{
        backgroundImage: bgImage,
        backgroundColor: fallbackColor // Fallback if image not found
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src="/assets/sounds/alarm.mp3" preload="auto" />

      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-10 flex gap-4">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        <button
          onClick={loadStats}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
        >
          <BarChart2 size={20} />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
        >
          <Settings2 size={20} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all hidden sm:block"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Main Timer UI */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white/20 text-center w-[90%] max-w-md mx-auto">

        {/* Mode Selector */}
        <div className="flex justify-center gap-2 mb-8 bg-black/20 p-2 rounded-full">
          {(["work", "shortBreak", "longBreak"] as const).map((m) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === m
                  ? "bg-white text-black shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {m === "work" ? "Pomodoro" : m === "shortBreak" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-[6rem] md:text-[8rem] font-black tracking-tighter text-white tabular-nums leading-none mb-8 drop-shadow-lg">
          {formatTime(timeLeft)}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleTimer}
            className={`px-12 py-4 rounded-full text-2xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
              isRunning
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {isRunning ? "PAUSE" : "START"}
          </button>

          {isRunning && (
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(settings[mode] * 60);
                syncTimerState(mode, false, settings[mode] * 60);
              }}
              className="text-white/60 hover:text-white transition-colors text-sm uppercase tracking-widest font-bold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <form
            onSubmit={saveSettings}
            className="relative bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-white/10"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Settings2 size={20} className="text-white/60" />
              Timer Settings
            </h3>

            <div className="space-y-4 mb-8">
              {[
                { id: "work", label: "Pomodoro", val: settings.work },
                { id: "shortBreak", label: "Short Break", val: settings.shortBreak },
                { id: "longBreak", label: "Long Break", val: settings.longBreak },
              ].map((field) => (
                <div key={field.id} className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider px-1">
                    {field.label} (minutes)
                  </label>
                  <input
                    name={field.id}
                    type="number"
                    defaultValue={field.val}
                    min="1"
                    max="120"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/50 transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 py-4 font-bold text-white/60 hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 font-bold bg-white text-black rounded-xl shadow-lg hover:bg-white/90 transition-all"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics/Records Modal */}
      {showStats && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStats(false)} />
          <div className="relative bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl p-8 border border-white/10 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <BarChart2 size={20} className="text-white/60" />
                Daily Statistics
              </h3>
              <button onClick={() => setShowStats(false)} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4">
              {records.length === 0 ? (
                <p className="text-white/40 text-center py-8 italic">No records yet. Complete a timer to see stats!</p>
              ) : (
                records.map((record) => {
                  const total = record.workTime + record.shortBreakTime + record.longBreakTime;
                  return (
                    <div key={record.id} className="bg-black/30 rounded-2xl p-5 border border-white/5">
                      <div className="font-bold text-lg mb-4 text-white">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-red-400 font-medium">Focus ({Math.round(record.workTime / 60)}m)</span>
                            <span className="text-white/40">{Math.round((record.workTime / total) * 100 || 0)}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400" style={{ width: `${(record.workTime / total) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-green-400 font-medium">Short Break ({Math.round(record.shortBreakTime / 60)}m)</span>
                            <span className="text-white/40">{Math.round((record.shortBreakTime / total) * 100 || 0)}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400" style={{ width: `${(record.shortBreakTime / total) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-blue-400 font-medium">Long Break ({Math.round(record.longBreakTime / 60)}m)</span>
                            <span className="text-white/40">{Math.round((record.longBreakTime / total) * 100 || 0)}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400" style={{ width: `${(record.longBreakTime / total) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }).reverse() // Show newest first
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
