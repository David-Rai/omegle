import React, { useEffect } from 'react'
import { useState, useRef, useContext } from 'react'
import { PeerContext } from '../context/PeerConnection'
import { SocketContext } from '../context/Socket'
import { useNavigate } from 'react-router-dom'
import { RoomContext } from '../context/RoomName'

const Room = () => {
  const socket = useContext(SocketContext)
  const peer = useContext(PeerContext)
  const room = useContext(RoomContext)
  const { connection, createConnection, setPeerConnection } = peer
  const peerConnection = connection.current
  const peer1Ref = useRef(null)
  const peer2Ref = useRef(null)
  const streamRef = useRef(null)
  const remoteRef = useRef(null)
  const [ice, setIce] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    console.log(peerConnection.connectionState)
  }, [peerConnection.connectionState])

  useEffect(() => {
    console.log(peer2Ref.current)
  }, [peer2Ref.current])


  //Initial establish the media of the user
  useEffect(() => {
    // console.log(connection)

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
    socket.on("offer", handleOffer)

    //manually connecting to the socket server
    socket.connect()

    // Adding the new ICE Candidate
    socket.on("ice", handleICE);

    //Getting the SDP answer
    socket.on("answer", handleAnswer)


    return () => {
      socket.off("answer", handleAnswer)
      socket.off("ice", handleICE)
      socket.off("joined", handleJoin)
      socket.off("create-offer", createOffer)
      socket.off("offer", handleOffer)
      socket.off("ice", handleICE)
    }

  }, [socket])

  //Add the ICE Candidate when remoteDescription is set
  useEffect(() => {
    if (!peerConnection) {
      return
    }
    if (
      peerConnection.remoteDescription &&
      peerConnection.remoteDescription.type &&
      ice.length > 0
    ) {
      console.log("📥 Flushing buffered ICE candidates");
      addICE();
      setIce([]); // Clear after adding
    }

  }, [ice, peerConnection && peerConnection.remoteDescription]);

  //Handling the answer
  const handleAnswer = async (answer) => {
    if (answer) {
      console.log("got answer", answer)
      await peerConnection.setRemoteDescription(answer)
    }
  }
  //Handling the candidate
  const handleICE = async (candidate) => {
    if (!peerConnection) return

    try {
      console.log("new candidate", candidate)
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      setIce(prev => [...prev, candidate]);
    }
  };

  //Adding the ICE candidate
  const addICE = async () => {
    if (!peerConnection) return

    for (const candidate of ice) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("🧊 Buffered ICE candidate added");
      } catch (e) {
        console.error("❌ Error adding ICE:", e);
      }
    }

  }


  //Handling the offer
  const handleOffer = async (offer) => {
    if (offer) {
      await addShit()//adding the tracks of medias
      await peerConnection.setRemoteDescription(offer)//setting as remote
      await addICE()
      const answer = await peerConnection.createAnswer()
      console.log("answer created", answer)
      socket.emit("answer", { answer, roomName: room.current })
    }
  }

  //creating the room
  const createOffer = async () => {
    await addShit()//adding the tracks of medias

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    socket.emit("offer", { offer, roomName: room.current })
    console.log("Created offer", offer)
  };

  //handling the join
  const handleJoin = (roomName) => {
    room.current = roomName
    console.log(roomName)
  }

  //Adding the remote track to the peer instance
  const addShit = async () => {
    if (!peerConnection) return

    console.log("adding the track")

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {//add video,audio to peerConnection
        peerConnection.addTrack(track, streamRef.current)
      })
    }

    peerConnection.ontrack = async (e) => {
      if (e.track) {
        console.log("remote track",e.track)
        const stream = new MediaStream()
        stream.addTrack(e.track)
        peer2Ref.current.srcObject = stream
      }
    }

    //ICE candidate generation and sending to the remote user
    peerConnection.onicecandidate = async (e) => {
      if (e.candidate) {
        socket.emit("ice", { candidate: e.candidate, roomName: room.current })
      }
    }

  }

  const handleRefresh = () => {
    navigate("/")
    window.location.reload()
  }
  return (
    <main>
      <button onClick={handleRefresh} className='btn cursor-pointer'>Refresh</button>
      <div className="videos flex">
        <video autoPlay playsInline ref={peer1Ref} className='w-1/2'></video>
        <video autoPlay playsInline ref={peer2Ref} className='bg-black'></video>
      </div>
    </main>
  )
}

export default Room