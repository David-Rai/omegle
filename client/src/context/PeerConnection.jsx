import React, { createContext, useEffect, useState } from "react";
import { useRef } from "react";


export const PeerContext = createContext(null);

// STUN servers
const servers = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302']
    }
  ]
};

export const PeerProvider = ({ children }) => {
  const connection = useRef(null)


  //creating the peerConnetion
  const createConnection = () => {
    const newPeer = new RTCPeerConnection(servers);
    // console.log("created peer RTC",newPeer)
    connection.current = newPeer
    return newPeer;
  };

  //Ending the webRTC connection
  const endConnection = () => {
    connection.current.close()
    connection.current = null
  }

  useEffect(() => {
    // createConnection();

    // Optional cleanup when PeerProvider unmounts
    return () => {
      if (connection.current) {
        connection.current.close();
      }
    };
  }, []);

  return (
    <PeerContext.Provider value={{ connection, createConnection, endConnection }}>
      {children}
    </PeerContext.Provider>
  );
};  
