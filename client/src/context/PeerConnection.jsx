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

  const setPeerConnection = async (newPeer) => {
    connection.current = newPeer
  }

  const createConnection = () => {
    const newPeer = new RTCPeerConnection(servers);
    setPeerConnection(newPeer);
    return newPeer;
  };

  useEffect(() => {
    createConnection();

    // Optional cleanup when PeerProvider unmounts
    return () => {
      if (connection.current) {
        connection.current.close();
      }
    };
  }, []);

  return (
    <PeerContext.Provider value={{ connection, setPeerConnection, createConnection }}>
      {children}
    </PeerContext.Provider>
  );
};  
