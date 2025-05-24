import React, { useEffect } from 'react'
import { useState, useRef, useContext } from 'react'
import { PeerContext } from '../context/PeerConnection'
import { SocketContext } from '../context/Socket'
import { io } from 'socket.io-client'

const Room = () => {
  const peer = useContext(PeerContext)
  const client=useContext(SocketContext)
  const peer1Ref = useRef(null)
  const peer2Ref = useRef(null)
  const streamRef = useRef(null)
  const remoteRef = useRef(null)
  const [clinetRoomName,setRoomName]=useState(null)
  let { peerConnection, createConnection, setPeerConnection } = peer

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
    client.on("joined", roomName => {
    setRoomName(roomName)
    console.log(roomName)
    })

    //when servers say to generate the offer
    client.on("create-offer", createOffer)

  }, [])


  //creating the offer SDP
  const createOffer = async () => {
    if (!peerConnection) return
    console.log("creating the offer")

    await addShit()
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    console.log(offer)
    client.emit("offer", { offer, roomName:clinetRoomName})
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