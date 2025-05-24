import React from 'react'
import { useContext } from 'react'
import { SocketContext } from './context/Socket.jsx'

const App = () => {
const client=useContext(SocketContext)

client.on("connect",()=>{
  console.log("Connected to the socket server")
})

  return (
    <div>App</div>
  )
}

export default App