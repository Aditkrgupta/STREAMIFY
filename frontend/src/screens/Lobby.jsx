import React from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitt = useCallback((e) => {
    e.preventDefault();
    socket.emit('room:join', { email, room });
  }, [room, email, socket]);

  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
  }, []);

  useEffect(() => {
    socket.on('room:join', handleJoinRoom);
    return () => {
      socket.off('room:join');
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-emerald-500 rounded-2xl shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mt-4">Video Connect</h1>
            <p className="text-white/60">Join a room to start video calling</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitt} className="space-y-4">
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-emerald-400"
            />

            <input
              type="text"
              placeholder="Enter Room ID"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-emerald-400"
            />

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all shadow-lg"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;