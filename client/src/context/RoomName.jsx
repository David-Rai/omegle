import { useState, useRef, useEffect } from 'react'
import { createContext } from 'react'

export const RoomContext = createContext(null)

export const RoomProvider = ({ children }) => {
    const room = useRef(null)//roomName state variable

    //updating the roomName
    const updateRoomName = (newRoomName) => {
        if (roomName.current) {
            roomName.current.value = newRoomName
        }
    }

    return (
        <RoomContext.Provider value={room}>
            {
                children
            }
        </RoomContext.Provider>
    )
}