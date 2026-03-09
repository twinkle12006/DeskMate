import React, { useState } from "react";
import socket from "../utils/socket";
import ScreenShareView from "./ScreenShareView";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/";

const HelpDashboard = () => {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const [status, setStatus] = useState("idle");

  // ── Full reset back to "idle" (Enter access code view) ───────────────────
  const resetToIdle = () => {
    setStatus("idle");
    setAccessCode("");
    setConnectionId(null);
    setError("");
  };

  const handleConnect = async () => {
    if (!accessCode.trim()) {
      setError("Please enter an access code.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}api/sessions/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to join session.");
        return;
      }

      setConnectionId(data.connectionId);
      socket.connect();
      socket.emit("join-room", { code: accessCode.trim(), role: "guest" });

      // If host ends the session, navigate back to idle
      socket.on("session-ended", () => {
        socket.off("session-ended");
        socket.disconnect();
        resetToIdle(); // ← go back to enter-code view
        setError("Host ended the session.");
      });

      setStatus("connected");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Guest clicks Disconnect → back to idle
  const handleDisconnect = () => {
    socket.emit("end-session", { code: accessCode });
    socket.off("session-ended");
    socket.disconnect();
    resetToIdle(); // ← navigate back to enter-code view
  };

  // ── Connected: show ScreenShareView ──────────────────────────────────────
  if (status === "connected") {
    return (
      <ScreenShareView
        role="guest"
        code={accessCode}
        onEnd={handleDisconnect} // ← clicking Disconnect calls handleDisconnect → resetToIdle
      />
    );
  }

  // ── Idle: enter access code ───────────────────────────────────────────────
  return (
    <div className="relative group overflow-hidden bg-zinc-950/40 border border-zinc-800/50 rounded-[40px] p-1 shadow-2xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-20 p-6 sm:p-8 md:p-12 lg:p-16 rounded-[38px] hero-gradient">
        {/* Monitor illustration */}
        <div className="relative w-full max-w-[220px] sm:max-w-sm aspect-square bg-[#1a1a24]/50 rounded-3xl flex items-center justify-center p-8 overflow-hidden group-hover:shadow-[0_0_50px_rgba(139,92,246,0.1)] transition-all duration-700 flex-shrink-0">
          <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-zinc-700 rounded-full" />
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-purple-900 rounded-full" />
          <div className="relative w-36 sm:w-48 h-28 sm:h-36 bg-purple-900/40 border-4 border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-zinc-800/50" />
          </div>
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-12 h-6 border-b-4 border-zinc-800 rounded-b-lg" />
          <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-20 h-1 bg-zinc-800 rounded-full" />
        </div>

        <div className="flex-1 text-center lg:text-left w-full">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 leading-tight">
            Connect to another computer
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 mb-6 sm:mb-10">
            Enter the access code shared by the person you want to help.
          </p>

          <div className="flex justify-center lg:justify-start">
            <input
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              className="mb-4 w-full max-w-xs border border-white/70 bg-[#0a0a0c] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <p className="text-sm text-zinc-400 mb-6 mt-2 max-w-md mx-auto lg:mx-0">
            The host has 5 minutes to share their screen after you connect.
          </p>

          {error && (
            <div className="mb-4 text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 max-w-xs mx-auto lg:mx-0">
              {error}
            </div>
          )}

          <div className="flex justify-center lg:justify-start">
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-8 py-3 w-44 h-14 rounded-3xl cursor-pointer text-sm font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-[#7c3aed] to-[#c026d3] hover:from-[#8b5cf6] hover:to-[#d946ef] shadow-lg shadow-[rgba(124,58,237,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Connecting..." : "Connect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDashboard;
