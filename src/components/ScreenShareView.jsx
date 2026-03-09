// src/components/ScreenShareView.jsx
import React from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import { MonitorOff, Wifi, WifiOff, Loader, Monitor } from "lucide-react";
import socket from "../utils/socket";

const ScreenShareView = ({ role, code, onEnd }) => {
  const {
    localVideoRef,
    remoteVideoRef,
    isCapturing,
    isConnected,
    guestReady,
    error,
    stopSharing,
    startScreenShare,
  } = useWebRTC(role, code, onEnd);
  // ↑ onEnd is passed as onSessionEnded — fires when the REMOTE peer ends the session

  // When THIS peer clicks Stop/Disconnect:
  // 1. emit end-session → server fires session-ended to other peer → they call onEnd too
  // 2. clean up local WebRTC
  // 3. disconnect socket
  // 4. call onEnd → navigate back to own view
  const handleEnd = () => {
    socket.emit("end-session", { code });
    stopSharing();
    socket.disconnect();
    onEnd?.();
  };

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden bg-zinc-950 border border-zinc-800/50 shadow-2xl">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi size={14} className="text-green-400" />
              <span className="text-[11px] font-bold text-green-400 uppercase tracking-widest">
                Stream Active
              </span>
            </>
          ) : (
            <>
              <Loader size={14} className="text-yellow-400 animate-spin" />
              <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest">
                {role === "host"
                  ? guestReady
                    ? "Guest ready — click Start Sharing"
                    : "Waiting for guest..."
                  : "Waiting for host to share screen..."}
              </span>
            </>
          )}
        </div>
        <button
          onClick={handleEnd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-bold uppercase tracking-widest transition-colors border border-red-500/20"
        >
          <MonitorOff size={12} />
          {role === "host" ? "Stop Sharing" : "Disconnect"}
        </button>
      </div>

      {/* Main area */}
      <div
        className="relative w-full bg-zinc-950"
        style={{ minHeight: "420px" }}
      >
        {/* GUEST: remote stream */}
        {role === "guest" && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            style={{ minHeight: "420px", background: "#09090b" }}
          />
        )}

        {/* HOST: hidden remote ref */}
        {role === "host" && (
          <video ref={remoteVideoRef} style={{ display: "none" }} />
        )}

        {/* HOST UI */}
        {role === "host" && (
          <div className="flex flex-col items-center justify-center w-full gap-6 py-16 px-8">
            {!isCapturing && !guestReady && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-pulse">
                  <Loader size={28} className="text-purple-400" />
                </div>
                <p className="text-zinc-300 font-semibold">
                  Waiting for guest to join
                </p>
                <p className="text-zinc-500 text-sm">
                  Share your access code with the person you want to connect
                  with.
                </p>
              </div>
            )}

            {!isCapturing && guestReady && (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Monitor size={28} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg mb-1">
                    Guest has joined!
                  </p>
                  <p className="text-zinc-400 text-sm">
                    Click the button below to choose which screen to share.
                  </p>
                </div>
                <button
                  onClick={startScreenShare}
                  className="px-10 py-4 rounded-3xl cursor-pointer text-sm font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-[#7c3aed] to-[#c026d3] hover:from-[#8b5cf6] hover:to-[#d946ef] shadow-lg shadow-[rgba(124,58,237,0.3)] transition-all duration-300 active:scale-95"
                >
                  Start Sharing Screen
                </button>
              </div>
            )}

            {isCapturing && (
              <div className="flex flex-col items-center gap-4 text-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 font-bold text-sm uppercase tracking-widest">
                    {isConnected
                      ? "Screen is being shared"
                      : "Connecting peer..."}
                  </span>
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="rounded-2xl border border-zinc-700 shadow-lg w-full max-w-lg"
                  style={{
                    maxHeight: "280px",
                    objectFit: "contain",
                    background: "#09090b",
                  }}
                />
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                  Your screen preview
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 z-10">
            <div className="flex flex-col items-center gap-3 text-center px-8">
              <WifiOff size={32} className="text-red-400" />
              <p className="text-red-400 font-bold text-sm">{error}</p>
              <button
                onClick={handleEnd}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareView;
