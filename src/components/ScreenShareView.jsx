// src/components/ScreenShareView.jsx
import React, { useEffect, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import {
  MonitorOff,
  WifiOff,
  Loader,
  Monitor,
  Smartphone,
  Camera,
  Play,
} from "lucide-react";
import socket from "../utils/socket";

const ScreenShareView = ({
  role,
  code,
  onEnd,
  guestReady: initialGuestReady = false,
}) => {
  const {
    localVideoRef,
    remoteVideoRef,
    isCapturing,
    isConnected,
    guestReady,
    error,
    isMobileHost,
    stopSharing,
    startScreenShare,
    startCameraShare,
  } = useWebRTC(role, code, onEnd, initialGuestReady);

  const [needsTap, setNeedsTap] = useState(false);

  // Lock body scroll
  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    return () => Object.assign(document.body.style, prev);
  }, []);

  // Guest: watch for stream + handle autoplay block
  useEffect(() => {
    if (role !== "guest") return;
    const video = remoteVideoRef.current;
    if (!video) return;
    const tryPlay = () => {
      video
        .play()
        .then(() => setNeedsTap(false))
        .catch(() => setNeedsTap(true));
    };
    video.addEventListener("loadedmetadata", tryPlay);
    if (video.srcObject) tryPlay();
    return () => video.removeEventListener("loadedmetadata", tryPlay);
  }, [role, remoteVideoRef, isConnected]);

  const handleEnd = () => {
    socket.emit("end-session", { code });
    stopSharing();
    socket.disconnect();
    onEnd?.();
  };

  const s = {
    wrap: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#09090b",
      display: "flex",
      flexDirection: "column",
    },
    topbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      flexShrink: 0,
      minHeight: 52,
      background: "rgba(9,9,11,0.98)",
      borderBottom: "1px solid rgba(63,63,70,0.5)",
    },
    dot: (ok) => ({
      width: 8,
      height: 8,
      borderRadius: "50%",
      flexShrink: 0,
      background: ok ? "#4ade80" : "#facc15",
      boxShadow: ok
        ? "0 0 8px rgba(74,222,128,0.8)"
        : "0 0 8px rgba(250,204,21,0.6)",
    }),
    label: (ok) => ({
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: "nowrap",
      color: ok ? "#4ade80" : "#facc15",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    }),
    endBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 12,
      flexShrink: 0,
      background: "rgba(239,68,68,0.15)",
      border: "1px solid rgba(239,68,68,0.35)",
      color: "#f87171",
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
  };

  const TopBar = () => (
    <div style={s.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={s.dot(isConnected)} />
        <span style={s.label(isConnected)}>
          {isConnected
            ? "Live"
            : role === "host"
              ? guestReady
                ? "Guest ready — start sharing"
                : "Waiting for guest..."
              : "Waiting for host..."}
        </span>
      </div>
      <button onClick={handleEnd} style={s.endBtn}>
        <MonitorOff size={13} />
        {role === "host" ? "Stop" : "Disconnect"}
      </button>
    </div>
  );

  // ── GUEST view ─────────────────────────────────────────────────────────────
  if (role === "guest") {
    return (
      <div style={s.wrap}>
        <TopBar />
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "#09090b",
              display: "block",
            }}
          />

          {/* Waiting for host overlay */}
          {!isConnected && !needsTap && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "0 32px",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader size={28} color="#a855f7" />
              </div>
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Waiting for host to share screen...
              </p>
              <p
                style={{
                  color: "#52525b",
                  fontSize: 13,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Host needs to click "Start Sharing Screen"
              </p>
            </div>
          )}

          {/* Tap-to-play (mobile autoplay blocked) */}
          {needsTap && (
            <div
              onClick={() =>
                remoteVideoRef.current?.play().then(() => setNeedsTap(false))
              }
              style={{
                position: "absolute",
                inset: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                background: "rgba(9,9,11,0.85)",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(124,58,237,0.25)",
                  border: "2px solid rgba(124,58,237,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Play size={32} color="#a855f7" fill="#a855f7" />
              </div>
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Tap to start viewing
              </p>
            </div>
          )}
        </div>
        {error && <ErrorOverlay error={error} onClose={handleEnd} />}
      </div>
    );
  }

  // ── HOST view ──────────────────────────────────────────────────────────────
  return (
    <div style={s.wrap}>
      <TopBar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          overflow: "auto",
        }}
      >
        <video ref={remoteVideoRef} style={{ display: "none" }} />
        {/* Waiting for guest */}
        {!isCapturing && !guestReady && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              textAlign: "center",
              maxWidth: 360,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader size={32} color="#a855f7" />
            </div>
            <p
              style={{
                color: "#e4e4e7",
                fontWeight: 700,
                fontSize: 20,
                margin: 0,
              }}
            >
              Waiting for guest
            </p>
            <p
              style={{
                color: "#71717a",
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Share your access code with the person you want to connect with.
            </p>
          </div>
        )}

        {/* Guest joined — pick sharing method */}
        {!isCapturing && guestReady && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              textAlign: "center",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Monitor size={32} color="#4ade80" />
            </div>
            <div>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 22,
                  margin: "0 0 8px",
                }}
              >
                Guest has joined! 🎉
              </p>
              {isMobileHost ? (
                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Screen sharing isn't available on mobile. Share your{" "}
                  <strong style={{ color: "#e4e4e7" }}>camera</strong> or use a{" "}
                  <strong style={{ color: "#e4e4e7" }}>desktop browser</strong>.
                </p>
              ) : (
                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Click below, then pick{" "}
                  <strong style={{ color: "#e4e4e7" }}>Entire Screen</strong>.
                </p>
              )}
            </div>

            {!isMobileHost && (
              <button
                onClick={startScreenShare}
                style={{
                  padding: "16px 40px",
                  borderRadius: 40,
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  background: "linear-gradient(135deg, #7c3aed, #c026d3)",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
                }}
              >
                Start Sharing Screen
              </button>
            )}

            {isMobileHost && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  width: "100%",
                  maxWidth: 300,
                }}
              >
                <button
                  onClick={startCameraShare}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "14px 24px",
                    borderRadius: 40,
                    border: "none",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    background: "linear-gradient(135deg, #7c3aed, #c026d3)",
                    cursor: "pointer",
                    boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
                  }}
                >
                  <Camera size={16} /> Share Camera
                </button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderRadius: 14,
                    background: "rgba(250,204,21,0.08)",
                    border: "1px solid rgba(250,204,21,0.2)",
                  }}
                >
                  <Smartphone
                    size={15}
                    color="#facc15"
                    style={{ flexShrink: 0 }}
                  />
                  <p
                    style={{
                      color: "#fbbf24",
                      fontSize: 12,
                      fontWeight: 600,
                      margin: 0,
                      textAlign: "left",
                      lineHeight: 1.4,
                    }}
                  >
                    For screen sharing, use Chrome or Edge on desktop
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Capturing — show local preview */}
        {isCapturing && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              width: "100%",
              maxWidth: 720,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 8px rgba(74,222,128,0.8)",
                }}
              />
              <span
                style={{
                  color: "#4ade80",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {isConnected
                  ? "Stream active — guest can see your screen"
                  : "Connecting via TURN relay..."}
              </span>
            </div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                maxHeight: "calc(100vh - 200px)",
                objectFit: "contain",
                borderRadius: 16,
                border: "1px solid rgba(63,63,70,0.6)",
                background: "#09090b",
              }}
            />
            <p
              style={{
                color: "#52525b",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                margin: 0,
              }}
            >
              {isMobileHost ? "Camera preview" : "Your screen preview"}
            </p>
          </div>
        )}
      </div>
      {error && <ErrorOverlay error={error} onClose={handleEnd} />}
    </div>
  );
};

const ErrorOverlay = ({ error, onClose }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(9,9,11,0.93)",
    }}
  >
    <div style={{ textAlign: "center", padding: "0 32px", maxWidth: 340 }}>
      <WifiOff size={36} color="#f87171" style={{ margin: "0 auto 16px" }} />
      <p
        style={{
          color: "#f87171",
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 20,
          whiteSpace: "pre-line",
          lineHeight: 1.5,
        }}
      >
        {error}
      </p>
      <button
        onClick={onClose}
        style={{
          padding: "10px 28px",
          borderRadius: 12,
          background: "rgba(39,39,42,0.9)",
          border: "1px solid rgba(63,63,70,0.5)",
          color: "#d4d4d8",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  </div>
);

export default ScreenShareView;
