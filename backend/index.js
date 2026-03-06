const express=require('express')
const { Server } = require('socket.io')
const app=express()
const PORT=process.env.PORT||8000
const server=app.listen(PORT,()=>{
    console.log('server running on port',PORT)
})
const io = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
})
const emailToSocketIdMap=new Map()
const socketIdToEmailMap=new Map()
io.on('connection',(socket)=>{
    console.log('Socket Connected', socket.id)
    socket.on('room:join',(data)=>{
        const {email,room}=data
        emailToSocketIdMap.set(email,socket.id)
        socketIdToEmailMap.set(socket.id,email)
        io.to(room).emit('user:joined',{email,id:socket.id})
        socket.join(room)
        io.to(socket.id).emit('room:join',data)

       
    })
    socket.on('user:call',({to,offer})=>{
        io.to(to).emit('incoming:call',{from:socket.id,offer})
    })
     socket.on('call:accepted',({to,ans})=>{
        io.to(to).emit('call:accepted',{from:socket.id,ans})
     })

        socket.on('peer:nego:needed',({to,offer})=>{
        io.to(to).emit('peer:nego:needed',{from:socket.id,offer})
     })
         socket.on('peer:nego:done',({to,ans})=>{
        io.to(to).emit('peer:nego:final',{from:socket.id,ans})
     })
})