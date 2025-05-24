import { createContext } from "react";
import {io} from 'socket.io-client'

export const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
    const socket = io("http://localhost:1111/")
    
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )

}

