import React, { createContext, useEffect, useState } from "react";

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
  const [peerConnection, setPeerConnection] = useState(null);

  const createConnection = () => {
    const connection = new RTCPeerConnection(servers);
    setPeerConnection(connection);
    return connection;
  };

  useEffect(() => {
    createConnection();
    // Optional cleanup when PeerProvider unmounts
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, []);

  return (
    <PeerContext.Provider value={{ peerConnection, setPeerConnection, createConnection }}>
      {children}
    </PeerContext.Provider>
  );
};
