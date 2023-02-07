const express = require('express')
const http = require('http')
const app = express()
const serverio = http.createServer(app)
// const server = app.listen(3100)
let io = require('socket.io')(serverio, { path: '/online' })
io.of('/stream').on('connection', (socket) => {
  console.log('Client connected successfully...')
  socket.on('gabung', async (data) => {
    // subscribe/join a room
    // console.log(data)
    socket.join(data.akun)
    socket.join(data.compCode)
  })
  socket.on('getOnline', () => {
    let rooms = io.sockets.adapter.rooms
    console.log(rooms)
    console.log(io.sockets.adapter.rooms)
    socket.emit('cekOnline', rooms)
  })
  socket.on('sendAll', (data) => {
    socket.broadcast.emit('pesan', data)
  })
  socket.on('balas', (data) => {
    socket.to(data.kepada).emit('umbal', data)
  })
})
serverio.listen(3002)