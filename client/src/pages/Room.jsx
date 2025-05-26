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
  const { connection, createConnection } = peer
  let peerConnection =connection.current
  const peer1Ref = useRef(null)
  const peer2Ref = useRef(null)
  const streamRef = useRef(null)
  const remoteRef = useRef(null)
  const [ice, setIce] = useState([])
  const navigate = useNavigate()


  //Initial establish the media of the user
  useEffect(() => {

    //adding the local medias
    async function getMedias() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      peer1Ref.current.srcObject = stream
      streamRef.current = stream
    }
    getMedias()

    //PeerConnection connection state handling
    if (connection.current) {
      connection.current.onconnectionstatechange = () => {
        const state = peerConnection.connectionState
        if (state === "disconnected" || state === "failed" || state === "closed") {
          handleLeave()
        }
      }

    }


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

    // Adding the new ICE Candidate
    socket.on("ice", handleICE);

    //Getting the SDP answer
    socket.on("answer", handleAnswer)

    //connection error for socket io
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });


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

  //Handling when peer intensionly leaves
  const handleLeave = () => {
    console.log("another peer leaved intensionly")
  }

  //Handling the answer
  const handleAnswer = async (answer) => {
    if (answer) {
      console.log("got answer", answer)
      await peerConnection.setRemoteDescription(answer)
      await addICE()
    }
  }
  //Handling the candidate
  const handleICE = async (candidate) => {
    if (!peerConnection) return

    try {
      // console.log("new candidate", candidate)
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
      console.log("got offer", offer)
      await peerConnection.setRemoteDescription(offer)//setting as remote
      await addICE()
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
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
        if (!remoteRef.current) {
          remoteRef.current = new MediaStream();
          peer2Ref.current.srcObject = remoteRef.current;
        }
        remoteRef.current.addTrack(e.track);
        // peer2Ref.current.srcObject = remoteRef.current;
        console.log("🔊 Remote stream updated:", remoteRef.current);
      }
    };


    //ICE candidate generation and sending to the remote user
    peerConnection.onicecandidate = async (e) => {
      if (e.candidate) {
        socket.emit("ice", { candidate: e.candidate, roomName: room.current })
      }
    }

  }

  //Starting WebRTC connection
  const handleStart = async () => {
    console.log("starting the connection")
    //manually connecting to the socket server and the webRTC API
     createConnection()
     peerConnection=connection.current
    console.log(peerConnection)
    console.log(connection.current)
    socket.connect()
  }

  const handleRefresh = () => {
    navigate("/")
    window.location.reload()
  }
  return (
    <main>
      <button onClick={handleRefresh} className='btn cursor-pointer'>Refresh</button>

      {/* Videos of your and remote user */}
      <div className="videos flex">
        <video autoPlay playsInline ref={peer1Ref} className='w-1/2'></video>
        <video autoPlay playsInline ref={peer2Ref} className='bg-black w-1/2'></video>
      </div>

      {/* Start,Stop,Next user features */}
      <div className="controls">
        <button className='btn bg-green-500' onClick={handleStart}>Start</button>
        <button className='btn bg-orange-500'>Stop</button>
      </div>
    </main>
  )
}

export default Room