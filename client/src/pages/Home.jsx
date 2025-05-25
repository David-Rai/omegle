import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'

const Home = () => {
    const nameRef = useRef(null)
    const authRef = useRef(null)
    const navigate = useNavigate()


    //handling the room join
    const handleJoin = () => {
        const name = nameRef.current.value

        if (name.trim() === "") {
            return authRef.current.innerText = "name is required"
        }
        console.log(name)

        navigate("/room")
    }

    return (
        <main className='h-screen w-full flex items-center justify-center'>
            <div className="center flex w-[80%] flex-col items-center justify-center gap-3">
                <input type="text" placeholder='username' ref={nameRef}
                    onChange={e => nameRef.current.value = e.target.value}
                    value="david"
                    className='w-full border-2 border-black p-3'
                />
                <p ref={authRef}></p>
                <button onClick={handleJoin} className='btn'>Join</button>
            </div>
        </main>
    )
}

export default Home