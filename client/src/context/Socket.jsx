import { createContext, useEffect, useRef } from "react";
import { io } from 'socket.io-client'

export const SocketContext = createContext(null)

//socket provider function
export const SocketProvider = ({ children }) => {

    const socket = useRef(null)

    useEffect(() => {
        socket.current =io("http://localhost:1111", {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 1111
        })

        return () => {
            socket.current.disconnect()
        }
    }, [])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )

}

