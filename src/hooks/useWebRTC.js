// src/hooks/useWebRTC.js
import { useEffect, useRef, useCallback, useState } from "react";
import socket from "../utils/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = (role, code, onSessionEnded) => {
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
  const [guestReady, setGuestReady] = useState(false);
  const [error, setError] = useState(null);

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
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setIsConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState))
        setIsConnected(false);
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
    };
    return pc;
  }, [code]);

  // HOST: triggered by button click — must be a direct user gesture
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", frameRate: { ideal: 30, max: 60 } },
        audio: false,
      });
      localStreamRef.current = stream;
      setIsCapturing(true);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Browser's native Stop Sharing button → kick both peers out
      stream.getVideoTracks()[0].onended = () => {
        socket.emit("end-session", { code });
        stopSharing();
        onSessionEndedRef.current?.();
      };

      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { code, offer });
    } catch (err) {
      if (err.name === "NotAllowedError")
        setError("Screen share permission denied.");
      else setError("Screen capture failed: " + err.message);
    }
  }, [code, createPeerConnection, stopSharing]);

  const handleOffer = useCallback(
    async (offer) => {
      const pc = createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { code, answer });
      } catch (err) {
        setError("Failed to handle offer: " + err.message);
      }
    },
    [code, createPeerConnection],
  );

  useEffect(() => {
    if (!code) return;

    const onPeerJoined = () => {
      if (role === "host") setGuestReady(true);
    };
    const onOffer = async (offer) => {
      if (role === "guest") await handleOffer(offer);
    };
    const onAnswer = async (answer) => {
      if (role === "host") {
        try {
          await pcRef.current?.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
        } catch (err) {
          setError("Failed to set answer: " + err.message);
        }
      }
    };
    const onIceCandidate = async (candidate) => {
      try {
        if (pcRef.current && candidate)
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE error:", err);
      }
    };

    // The OTHER peer ended the session → clean up and navigate back
    const handleSessionEnded = () => {
      console.log("🔴 Remote peer ended session — navigating back");
      stopSharing();
      onSessionEndedRef.current?.();
    };

    socket.on("peer-joined", onPeerJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("session-ended", handleSessionEnded);

    return () => {
      socket.off("peer-joined", onPeerJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("session-ended", handleSessionEnded);
    };
  }, [code, role, handleOffer, stopSharing]);

  return {
    localVideoRef,
    remoteVideoRef,
    isCapturing,
    isConnected,
    guestReady,
    error,
    stopSharing,
    startScreenShare,
  };
};
