import React from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LobbyScreen=()=>{
    const [email,setEmail]=useState("")
    const [room,setRoom]=useState("")
    const socket=useSocket()
    const navigate=useNavigate()
    const handleSubmitt=useCallback((e)=>{
        e.preventDefault();
        socket.emit('room:join',{email,room})
    },[room,email,socket])

    const handleJoinRoom=useCallback((data)=>{
        const {email,room}=data
        navigate(`/room/${room}`)
    },[])

useEffect(()=>{
    socket.on('room:join',handleJoinRoom)
    return ()=>{
        socket.off('room:join')
    }
},[socket , handleJoinRoom])
   return (
  <div className="lobby-container">
    <h1>Join Video Room</h1>

    <form onSubmit={handleSubmitt}>

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input
        type="text"
        placeholder="Enter Room ID"
        value={room}
        onChange={(e)=>setRoom(e.target.value)}
      />
      
      <button>hello</button>
      <button>Join Room</button>

    </form>
  </div>
)
}
export default LobbyScreen