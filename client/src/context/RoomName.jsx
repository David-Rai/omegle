import { useState, useRef, useEffect } from 'react'
import { createContext } from 'react'

export const RoomContext = createContext(null)

export const RoomProvider = ({ children }) => {
    const room = useRef(null)//roomName state variable
    const username=useRef(null)

    //updating the roomName
    const updateRoomName = (newRoomName) => {
        if (roomName.current) {
            roomName.current= newRoomName
        }
    }

    return (
        <RoomContext.Provider value={{room,username}}>
            {
                children
            }
        </RoomContext.Provider>
    )
}