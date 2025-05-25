import React, { useEffect } from 'react'
import { useState, useRef, useContext } from 'react'
import { PeerContext } from '../context/PeerConnection'
import { SocketContext } from '../context/Socket'
import {useNavigate} from 'react-router-dom'

const Room = () => {
  const socket = useContext(SocketContext)
  const peer = useContext(PeerContext)
  const {connection, createConnection, setPeerConnection } = peer
  const peerConnection=connection.current
  const peer1Ref = useRef(null)
  const peer2Ref = useRef(null)
  const streamRef = useRef(null)
  const remoteRef = useRef(null)
  const navigate=useNavigate()
  const [clientRoomName, setClientRoomName] = useState(null)

  //Initial establish the media of the user
  useEffect(() => {
console.log(connection)

    //adding the local medias
    async function getMedias() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      peer1Ref.current.srcObject = stream
      streamRef.current = stream
    }
    getMedias()


    //Handling the socket connections
    if (socket.connected) {
      console.log("Already connected:", socket.id);
    } else {
      socket.on("connect", () => {
        console.log("Connected to:", socket.id);
      });
    }

    //onjoin
    socket.on("joined", handleJoin)

    //when servers say to generate the offer
    socket.on("create-offer", createOffer)

    //Getting the offer created
    socket.on("offer",handleOffer)

    //manually connecting to the socket server
    socket.connect()


    return () => {
      socket.off("joined", handleJoin)
      socket.off("create-offer", createOffer)
    }

  }, [socket])

  //Handling the offer
  const handleOffer=async (offer)=>{
    console.log(offer)
  }
  //creating the room
  const createOffer = async () => {
    console.log("Creating the offer")
    await addShit()//adding the tracks of medias
    
    const offer=await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    socket.emit("offer",{offer,roomName:clientRoomName})
    console.log(offer)
  };

  //handling the join
  const handleJoin = (roomName) => {
    setClientRoomName(roomName)
    console.log(roomName)
  }
  //Adding the remote track to the peer instance
  const addShit = async () => {
    if (!peerConnection) return

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {//add video,audio to peerConnection
        peerConnection.addTrack(track, streamRef.current)
      })
    }

    peerConnection.ontrack = async (e) => {
      if (e.streams[0]) {
        peer2Ref.current.srcObject = e.streams[0];
      }
    }

    // //ICE candidate generation and sending to the remote user
    // peerConnection.onicecandidate = async (e) => {
    //   if (e.candidate) {
    //     socket.emit("ice", { candidate: e.candidate, roomId: id })
    //   }
    // }

  }
const handleRefresh=()=>{
  navigate("/")
  window.location.reload()
}
  return (
    <main>
    <button onClick={handleRefresh} className='absolute top-2 left-2 btn'>Refresh</button>
      <div className="videos">
        <video autoPlay playsInline ref={peer1Ref}></video>
        <video autoPlay playsInline ref={peer2Ref}></video>
      </div>
    </main>
  )
}

export default Room