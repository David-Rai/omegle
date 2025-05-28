import { IoMdChatbubbles } from "react-icons/io";
import React, { useEffect } from 'react'
import { useState, useRef, useContext } from 'react'
import { PeerContext } from '../context/PeerConnection'
import { IoMdSend } from "react-icons/io";
import { SocketContext } from '../context/Socket'
import { useNavigate } from 'react-router-dom'
import { RoomContext } from '../context/RoomName'

const Room = () => {
  const data = useContext(SocketContext)
  const socket=data?.current
  const peer = useContext(PeerContext)
  const {room,username} = useContext(RoomContext)
  const { connection, createConnection, endConnection } = peer
  const peer1Ref = useRef(null)
  const peer2Ref = useRef(null)
  const streamRef = useRef(null)
  const remoteRef = useRef(null)
  const [ice, setIce] = useState([])
  const navigate = useNavigate()
  const messageRef = useRef(null)
  const [isStarted, setIsStarted] = useState(false)
  const [messageList, setMessageList] = useState([])


  //Initial establish the media of the user
  useEffect(() => {

    //adding the local medias
    async function getMedias() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio:{
        echoCancellation:true,
        noiseSuppression:true,
        autoGainControl:true
      } })

      peer1Ref.current.srcObject = stream
      peer1Ref.current.muted = true
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
      alert(`connect_error due to ${err.message}`);
    });

    //Getting the sended message
    socket.on("message", handleMessage)

    //when another users leaves
    socket.on("leaved", handleLeave)

    return () => {
      socket.off("message", handleMessage)
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
    setMessageList([])
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
      setMessageList([])
      setIsStarted(true)
      console.log("starting the RTC connection")
      createConnection()
      socket.connect()
    }
  }

  //Handling the sended message
  const handleMessage = (message) => {
    console.log("sended messgae", message)
    setMessageList(prev => [...prev, message])
  }

  //Ending the RTC connection
  const handleStop = () => {
    if (!socket.connected && !connection.current) return

    setMessageList([])
    setIsStarted(false)
    endConnection()
    peer2Ref.current.srcObject = null
    remoteRef.current = null
    socket.emit("stop", { roomName: room.current })
    socket.disconnect()
  }

  //Sending message
  const handleSend = () => {
    if (messageRef.current.value.trim() === "") {
      return console.log("enter the message")
    }
    const message = messageRef.current.value
    socket.emit("message", { roomName: room.current, message,name:username.current })
    messageRef.current.value = ""
  }

  // Handle pressing Enter key to join room
  useEffect(() => {
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    };

    document.addEventListener('keydown', handleEnter);
    return () => document.removeEventListener('keydown', handleEnter);
  }, []);


  return (
    <main className="w-full h-screen bg-gray-900 text-white flex flex-col relative overflow-hidden">

      {/* Video Section */}
      <div className="flex  items-center justify-center w-full h-1/2 md:h-[60%] lg:h-[75%]">
        <video
          autoPlay
          playsInline
          ref={peer1Ref}
          className="h-full w-1/2 object-cover bg-black shadow-lg"
        ></video>
        <video
          autoPlay
          playsInline
          ref={peer2Ref}
          className="h-full w-1/2 object-cover bg-black shadow-lg"
        ></video>
      </div>

      {/* Bottom Section */}
      <section className="bottom h-1/2 w-full md:h-[40%] lg:h-[25%]  bg-[#E3E3E3] flex">

        {/* Controls button */}
        <div className="w-1/2 h-full flex flex-col items-center justify-start p-3 gap-3 lg:flex-row">
          <button
            onClick={() => isStarted ? handleNext() : handleStart()}
            className="controlBtn bg-[#27c485] hover:bg-[#32db97]"
          >
            {isStarted ? "Next" : "Start"}
          </button>

          <button
            onClick={handleStop}
            className="controlBtn hover:bg-[#e6876a] bg-[#f47c57]"
          >
            Stop
          </button>
        </div>

        {/* Chat section */}
        <div className="chat bg-white h-full w-1/2 rounded-b-2xl m-3 mt-0 shadow-lg relative">
          <p className=" text-gray-600 w-full bg-white justify-start flex gap-1 items-center pl-3">Chat with eachother<IoMdChatbubbles /></p>
            <div className="overflow-y-scroll overflow-x-hidden h-[70%] lg:h-[50%] px-3">
              {
                messageList && messageList.map((message, index) => {
                  return (
                    <div key={index} className="bg-slate-300 rounded-md pl-2 text-slate-700 mt-3">
                   <p className="text-blue-500">{message.name}</p>
                   <h1>{message.message}</h1>
                    </div>
                  )
                })
              }
          </div>

          <div className='h-[20%] lg:h-[40%] flex items-center border-t-[1px] border-slate-300'>
            <input type="text" ref={messageRef} placeholder='Message' className='text-black w-[90%] pl-4 focus:border-none h-full rounded-b-2xl' />
            <button className='w-[10%] h-full flex items-center justify-center' onClick={handleSend}><IoMdSend size={30} className='text-blue-600'
            /></button>
          </div>
        </div>
      </section>
    </main>

  )
}

export default Room