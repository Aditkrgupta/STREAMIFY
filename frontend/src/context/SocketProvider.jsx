import React from "react";
import { useContext } from "react";
import { useMemo } from "react";
import { createContext } from "react";
import {io} from 'socket.io-client'
const SocketContext=createContext(null)
export const useSocket=()=>{
    const socket=useContext(SocketContext)
    return socket
}
export const SocketProvider=(props)=>{
    // const socket=useMemo(()=>io('https://streamify-backend-j3tp.onrender.com'),[])
        const socket=useMemo(()=>{
  const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
  return io(URL, {
    autoConnect: true,
    reconnection: true
  });
}, []);
    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>

    )
}

