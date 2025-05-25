import React, { useEffect } from 'react'
import { useState, useRef, useContext } from 'react'
import { PeerContext } from '../context/PeerConnection'
import { SocketContext } from '../context/Socket'

const Room = () => {
  const client = useContext(SocketContext)
  const peer = useContext(PeerContext)
  const { peerConnection, createConnection, setPeerConnection } = peer
  const peer1Ref = useRef(null)
  const peer2Ref = useRef(null)
  const streamRef = useRef(null)
  const remoteRef = useRef(null)
  const [clientRoomName, setClientRoomName] = useState(null)

  //Initial establish the media of the user
  useEffect(() => {

    //adding the local medias
    async function getMedias() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      peer1Ref.current.srcObject = stream
      streamRef.current = stream
    }
    getMedias()


    //Handling the socket connections
    client.on("connect", () => {
      console.log("connected to :", client.id)
    })

    //onjoin
    client.on("joined", handleJoin)

    //when servers say to generate the offer
    client.on("create-offer", createOffer)


    return () => {
      client.off("joined",handleJoin)
      client.off("create-offer", createOffer)
    }
    
  }, [])

  //creating the room
  const createOffer = async () => {
    console.log("Creating the offer")
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

    //ICE candidate generation and sending to the remote user
    peerConnection.onicecandidate = async (e) => {
      if (e.candidate) {
        socket.emit("ice", { candidate: e.candidate, roomId: id })
      }
    }

  }

  return (
    <main>
      <div className="videos">
        <video autoPlay playsInline ref={peer1Ref}></video>
        <video autoPlay playsInline ref={peer2Ref}></video>
      </div>
    </main>
  )
}

export default Room