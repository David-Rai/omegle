import {useState,useRef,useEffect} from 'react'
import {createContext} from 'react'

export const RoomContext=createContext(null)

export const RoomProvider=({children})=>{
    const roomName=useRef(null)//roomName state variable

    //updating the roomName
    const updateRoomName=(newRoomName)=>{
     roomName.current.value=newRoomName
    }

return (
    <RoomContext.Provider value={{roomName:roomName.current,updateRoomName}}>
        {
            children
        }
    </RoomContext.Provider>
)
}