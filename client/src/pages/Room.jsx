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
  const { connection, createConnection, endConnection } = peer
  const peer1Ref = useRef(null)
  const peer2Ref = useRef(null)
  const streamRef = useRef(null)
  const remoteRef = useRef(null)
  const [ice, setIce] = useState([])
  const navigate = useNavigate()
  const [isStarted, setIsStarted] = useState(false)


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
      connection.current.oniceconnectionstatechange = () => {
        const state = connection.current.iceConnectionState;
        console.log('ICE connection state:', state);

        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
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

    //when another users leaves
    socket.on("leaved", handleLeave)

    return () => {
      socket.off("answer", handleAnswer)
      socket.off("ice", handleICE)
      socket.off("joined", handleJoin)
      socket.off("create-offer", createOffer)
      socket.off("offer", handleOffer)
      socket.off("ice", handleICE)
      socket.off("leaved", handleLeave)
    }

  }, [socket])

  //Add the ICE Candidate when remoteDescription is set
  useEffect(() => {
    if (!connection.current) {
      return
    }
    if (
      connection.current.remoteDescription &&
      connection.current.remoteDescription.type &&
      ice.length > 0
    ) {
      console.log("📥 Flushing buffered ICE candidates");
      addICE();
      setIce([]); // Clear after adding
    }

  }, [ice, connection.current && connection.currentremoteDescription]);

  //Handling when peer intensionly leaves
  const handleLeave = (message) => {
    if (message) {
      console.log(message)
    }
    handleNext()
    console.log("another peer leaved intensionly")
  }

  const handleNext = () => {
    console.log("Going with the next peer....")
    handleStop()
    handleStart()
  }
  //Handling the answer
  const handleAnswer = async (answer) => {
    if (answer) {
      console.log("got answer", answer)
      await connection.current.setRemoteDescription(answer)
      await addICE()
    }
  }
  //Handling the candidate
  const handleICE = async (candidate) => {
    if (!connection.current) return

    try {
      // console.log("new candidate", candidate)
      await connection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      setIce(prev => [...prev, candidate]);
    }
  };

  //Adding the ICE candidate
  const addICE = async () => {
    if (!connection.current) return

    for (const candidate of ice) {
      try {
        await connection.current.addIceCandidate(new RTCIceCandidate(candidate));
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
      await connection.current.setRemoteDescription(offer)//setting as remote

      const answer = await connection.current.createAnswer()
      await connection.current.setLocalDescription(answer)

      await addICE()
      console.log("answer created", answer)
      socket.emit("answer", { answer, roomName: room.current })
    }
  }

  //creating the room
  const createOffer = async () => {
    await addShit()//adding the tracks of medias

    const offer = await connection.current.createOffer()
    await connection.current.setLocalDescription(offer)
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
    if (!connection.current) return

    console.log("adding the track")

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {//add video,audio to peerConnection
        connection.current.addTrack(track, streamRef.current)
      })
    }

    connection.current.ontrack = async (e) => {
      if (e.track) {
        console.log("remote track", e.track)
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
    connection.current.onicecandidate = async (e) => {
      if (e.candidate) {
        socket.emit("ice", { candidate: e.candidate, roomName: room.current })
      }
    }

  }

  //Starting WebRTC connection
  const handleStart = async () => {
    //manually connecting to the socket server and the webRTC API
    if (!socket.connected) {
      setIsStarted(true)
      console.log("starting the RTC connection")
      createConnection()
      socket.connect()
    }
  }

  //Ending the RTC connection
  const handleStop = () => {
    if (!socket.connected && !connection.current) return

    setIsStarted(false)
    endConnection()
    peer2Ref.current.srcObject = null
    remoteRef.current = null
    socket.emit("stop", { roomName: room.current })
    socket.disconnect()
  }
  const handleRefresh = () => {
    navigate("/")
    window.location.reload()
  }
  return (
<main className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center relative">
  {/* Refresh Button */}
  <button
    onClick={handleRefresh}
    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-md"
  >
    Refresh
  </button>

  {/* Video Section */}
  <div className="flex flex-col md:flex-row items-center justify-center w-full h-full px-4 gap-4">
    <video
      autoPlay
      playsInline
      ref={peer1Ref}
      className="rounded-xl w-full md:w-1/2 max-h-[300px] md:max-h-[500px] object-cover bg-black shadow-lg"
    ></video>
    <video
      autoPlay
      playsInline
      ref={peer2Ref}
      className="rounded-xl w-full md:w-1/2 max-h-[300px] md:max-h-[500px] object-cover bg-black shadow-lg"
    ></video>
  </div>

  {/* Control Buttons */}
  <div className="fixed bottom-4 w-full flex items-center justify-center gap-4 px-4">
    <button
      onClick={() => isStarted ? handleNext() : handleStart()}
      className="btn flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg"
    >
      {isStarted ? "Next" : "Start"}
    </button>

    <button
      onClick={handleStop}
      className="btn  flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg"
    >
      Stop
    </button>
  </div>
</main>

  )
}

export default Room