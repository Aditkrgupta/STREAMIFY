import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";
import peer from "../service/peer";

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [filter, setFilter] = useState("none");
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMystream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`user : ${email}`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    const offer = await peer.getOffer();
    socket.emit('user:call', { to: remoteSocketId, offer });
    setMystream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    setMystream(stream);
    console.log(from, offer);
    const ans = await peer.getAnswer(offer);
    socket.emit('call:accepted', { to: from, ans });
  }, []);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleEndCall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    peer.peer.close();
    peer.resetPeer();

    setMystream(null);
    setRemoteStream(null);
    setRemoteSocketId(null);
  }, [myStream, remoteStream]);

  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    peer.setLocalDescription(ans);
    console.log('call-accepted');
    sendStreams();
  }, [sendStreams]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit('peer:nego:done', { to: from, ans });
  }, [socket]);

  const handleNegoNeedFinal = useCallback(async ({ from, ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  const handleChat = useCallback(() => {
    navigate(`/chat/${roomId}`);
  }, [navigate, roomId]);

  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener('track', (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on('user:joined', handleUserJoined);
    socket.on('incoming:call', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('peer:nego:needed', handleNegoNeededIncoming);
    socket.on('peer:nego:final', handleNegoNeedFinal);
    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('peer:nego:needed', handleNegoNeededIncoming);
      socket.off('peer:nego:final', handleNegoNeedFinal);
    };
  }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeededIncoming, handleNegoNeedFinal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Styled */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Room : {roomId}</h1>
              <h2 className="text-white/60 text-sm">
                {remoteSocketId ? "User Connected" : "Waiting for user..."}
              </h2>
            </div>
            <button
              onClick={handleChat}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md"
            >
              Chat
            </button>
          </div>
        </div>

        {/* Controls - Styled (All buttons intact) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6">
          <div className="flex gap-4">
            {remoteSocketId && (
              <button
                onClick={handleCallUser}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md"
              >
                Start Call
              </button>
            )}

            {myStream && (
              <button
                onClick={sendStreams}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
              >
                Send Stream
              </button>
            )}

            {(myStream || remoteStream) && (
              <button
                onClick={handleEndCall}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md"
              >
                End Call
              </button>
            )}
          </div>
        </div>

        {/* Video Section - Styled */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Camera */}
          {myStream && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <h3 className="text-white font-medium mb-3">My Camera</h3>
              <video
                autoPlay
                muted
                width="400"
                height="250"
                className="w-full rounded-lg"
                style={{ filter: filter }}
                ref={(video) => {
                  if (video && myStream) {
                    video.srcObject = myStream;
                  }
                }}
              />
              <div className="filters mt-3 flex gap-2">
                <button onClick={() => setFilter("grayscale(100%)")} className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30">Gray</button>
                <button onClick={() => setFilter("sepia(100%)")} className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30">Sepia</button>
                <button onClick={() => setFilter("blur(5px)")} className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30">Blur</button>
                <button onClick={() => setFilter("none")} className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30">Normal</button>
              </div>
            </div>
          )}

          {/* Remote User */}
          {remoteStream && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <h3 className="text-white font-medium mb-3">Remote User</h3>
              <video
                autoPlay
                width="400"
                height="250"
                className="w-full rounded-lg"
                ref={(video) => {
                  if (video && remoteStream) {
                    video.srcObject = remoteStream;
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;