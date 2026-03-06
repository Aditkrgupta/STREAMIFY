import React from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import { useEffect } from "react";
import { useCallback } from "react";
import { useState } from "react";
import peer from "../service/peer";
const RoomPage = () => {
    const socket = useSocket()
    const { roomId } = useParams()
    const [filter, setFilter] = useState("none")
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream, setMystream] = useState(null)
    const [remoteStream, setRemoteStream] = useState(null)
    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`user : ${email}`)
        setRemoteSocketId(id)
    }, [])

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        const offer = await peer.getOffer()
        socket.emit('user:call', { to: remoteSocketId, offer })
        setMystream(stream)
    }, [remoteSocketId, socket])

    const handleIncomingCall = useCallback(async ({ from, offer }) => {
        setRemoteSocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        setMystream(stream)
        console.log(from, offer)
        const ans = await peer.getAnswer(offer)
        socket.emit('call:accepted', { to: from, ans })
    }, [])

    const sendStreams=useCallback(()=>{
             for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream)
        }
    },[myStream])

    const handleEndCall=useCallback(()=>{
        if(myStream)
        {
            myStream.getTracks().forEach(track => track.stop());
        }
          if(remoteStream)
        {
            remoteStream.getTracks().forEach(track => track.stop());
        }
      peer.peer.close()
            peer.resetPeer()
        

        setMystream(null)
        setRemoteStream(null)
        setRemoteSocketId(null)
    },[myStream,remoteStream])

    const handleCallAccepted = useCallback(async ({ from, ans }) => {
        peer.setLocalDescription(ans)
        console.log('call-aacepted')
        sendStreams()
    }, [sendStreams])


    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer()
        socket.emit('peer:nego:needed', { offer, to: remoteSocketId })
    }, [remoteSocketId,socket])


    const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
        const ans = await peer.getAnswer(offer)
        socket.emit('peer:nego:done', { to: from, ans })
    }, [socket])

    const handleNegoNeedFinal = useCallback(async ({ from, ans }) => {
        await peer.setLocalDescription(ans)
    }, [])

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded)
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded)
        }
    }, [handleNegoNeeded])

    useEffect(() => {
        peer.peer.addEventListener('track', (ev) => {
            const remoteStream=ev.streams
            setRemoteStream(remoteStream[0])
        })
    }, [])



    useEffect(() => {
        socket.on('user:joined', handleUserJoined)
        socket.on('incoming:call', handleIncomingCall)
        socket.on('call:accepted', handleCallAccepted)
        socket.on('peer:nego:needed', handleNegoNeededIncoming)
        socket.on('peer:nego:final', handleNegoNeedFinal)
        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off('peer:nego:needed', handleNegoNeededIncoming)
            socket.off('peer:nego:final', handleNegoNeedFinal)
        }
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeededIncoming, handleNegoNeedFinal])
   return (
<div className="room-container">

  <h1>Room : {roomId}</h1>
  <h2>{remoteSocketId ? "User Connected" : "Waiting for user..."}</h2>

  <div className="controls">

    {remoteSocketId && (
      <button onClick={handleCallUser}>
        Start Call
      </button>
    )}

    {myStream && (
      <button onClick={sendStreams}>
        Send Stream
      </button>
    )}

      {(myStream || remoteStream) && (
    <button onClick={handleEndCall} style={{background:"red",color:"white"}}>
      End Call
    </button>
  )}


  </div>


  <div className="video-section">

    {myStream && (
      <div className="video-card">
        <h3>My Camera</h3>

        <video
          autoPlay
          width="400"
          height="250"
          style={{ filter: filter }}
          ref={(video)=>{
            if(video && myStream){
              video.srcObject = myStream
            }
          }}
        />

        <div className="filters">
          <button onClick={()=>setFilter("grayscale(100%)")}>Gray</button>
          <button onClick={()=>setFilter("sepia(100%)")}>Sepia</button>
          <button onClick={()=>setFilter("blur(5px)")}>Blur</button>
          <button onClick={()=>setFilter("none")}>Normal</button>
        </div>

      </div>
    )}


    {remoteStream && (
      <div className="video-card">
        <h3>Remote User</h3>

        <video
          autoPlay
          width="400"
          height="250"
          ref={(video)=>{
            if(video && remoteStream){
              video.srcObject = remoteStream
            }
          }}
        />

      </div>
    )}

  </div>

</div>
)
}
export default RoomPage