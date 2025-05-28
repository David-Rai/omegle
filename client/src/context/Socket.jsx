import { createContext, useEffect, useRef } from "react";
import { io } from 'socket.io-client'

export const SocketContext = createContext(null)

//socket provider function
export const SocketProvider = ({ children }) => {
    const socket = useRef(io("https://omegle-nz6g.onrender.com/",{autoConnect:false,
    // const socket = useRef(io("http://localhost:1111",{autoConnect:false,
        reconnection:true,
        reconnectionAttempts:Infinity,
        reconnectionDelay:1000,
        reconnectionDelayMax:5000,
        timeout:10000
    }))

    useEffect(() => {
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

