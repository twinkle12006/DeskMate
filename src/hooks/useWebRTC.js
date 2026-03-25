// src/hooks/useWebRTC.js
import { useEffect, useRef, useCallback, useState } from "react";
import socket from "../utils/socket";
const TURN_HOST = "deskmate";
const TURN_USER = "744bfc4fa8089e5e22b93c9c";
const TURN_PASS = "	CReueu7JXgSgW5QL";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: `turn:${TURN_HOST}:80`,
      username: TURN_USER,
      credential: TURN_PASS,
    },
    {
      urls: `turn:${TURN_HOST}:443`,
      username: TURN_USER,
      credential: TURN_PASS,
    },
    {
      urls: `turns:${TURN_HOST}:443`,
      username: TURN_USER,
      credential: TURN_PASS,
    },
  ],
  iceCandidatePoolSize: 10,
};

const canScreenShare = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getDisplayMedia === "function";

export const useWebRTC = (
  role,
  code,
  onSessionEnded,
  initialGuestReady = false,
) => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const onSessionEndedRef = useRef(onSessionEnded);

  useEffect(() => {
    onSessionEndedRef.current = onSessionEnded;
  }, [onSessionEnded]);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [guestReady, setGuestReady] = useState(initialGuestReady);
  const [error, setError] = useState(null);
  const [isMobileHost] = useState(role === "host" && !canScreenShare());

  const stopSharing = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsCapturing(false);
    setIsConnected(false);
    setGuestReady(false);
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) pcRef.current.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { code, candidate });
    };
    pc.oniceconnectionstatechange = () =>
      console.log("🧊 ICE:", pc.iceConnectionState);
    pc.onconnectionstatechange = () => {
      console.log("🔗 Conn:", pc.connectionState);
      if (pc.connectionState === "connected") setIsConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState))
        setIsConnected(false);
    };
    pc.ontrack = (event) => {
      console.log("🎥 ontrack fired");
      const stream = event.streams[0];
      if (!stream) return;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current
          .play()
          .catch((e) => console.warn("autoplay blocked:", e.message));
      }
    };
    return pc;
  }, [code]);

  const sendStream = useCallback(
    async (stream) => {
      localStreamRef.current = stream;
      setIsCapturing(true);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((t) => {
        t.onended = () => {
          socket.emit("end-session", { code });
          stopSharing();
          onSessionEndedRef.current?.();
        };
      });
      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { code, offer });
    },
    [code, createPeerConnection, stopSharing],
  );
  const startScreenShare = useCallback(async () => {
    if (!canScreenShare()) {
      setError(
        "Screen sharing isn't supported on mobile.\nUse a desktop browser to share your screen.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", frameRate: { ideal: 30, max: 60 } },
        audio: true,
      });
      await sendStream(stream);
    } catch (err) {
      if (err.name === "NotAllowedError")
        setError("Screen share permission denied.");
      else setError("Screen capture failed: " + err.message);
    }
  }, [sendStream]);

  const startCameraShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      await sendStream(stream);
    } catch (err) {
      if (err.name === "NotAllowedError") setError("Camera permission denied.");
      else setError("Camera failed: " + err.message);
    }
  }, [sendStream]);

  const handleOffer = useCallback(
    async (offer) => {
      const pc = createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { code, answer });
      } catch (err) {
        setError("Failed to connect: " + err.message);
      }
    },
    [code, createPeerConnection],
  );

  useEffect(() => {
    if (!code) return;
    const onPeerJoined = () => {
      if (role === "host") setGuestReady(true);
    };
    const onOffer = (offer) => {
      if (role === "guest") handleOffer(offer);
    };
    const onAnswer = async (answer) => {
      if (role === "host") {
        try {
          await pcRef.current?.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
        } catch (err) {
          setError("Failed: " + err.message);
        }
      }
    };
    const onIceCandidate = async (candidate) => {
      try {
        if (pcRef.current && candidate)
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    };
    const onSessionEnded = () => {
      stopSharing();
      onSessionEndedRef.current?.();
    };

    socket.on("peer-joined", onPeerJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("session-ended", onSessionEnded);

    return () => {
      socket.off("peer-joined", onPeerJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("session-ended", onSessionEnded);
    };
  }, [code, role, handleOffer, stopSharing]);

  return {
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
  };
};
