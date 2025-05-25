import { createContext, useEffect, useRef } from "react";
import { io } from 'socket.io-client'

export const SocketContext = createContext(null)

//socket provider function
export const SocketProvider = ({ children }) => {
    const socket = useRef(io("http://localhost:1111"))

    useEffect(() => {
        socket.current = io("http://localhost:1111")

        return () => {
            socket.current.disconnect()
        }
    }, [])

    return (
        <SocketContext.Provider value={socket.current}>
            {children}
        </SocketContext.Provider>
    )

}

