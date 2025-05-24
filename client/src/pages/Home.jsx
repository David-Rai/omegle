import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

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

        navigate("room")
    }

    return (
        <main>
            <div className="center">
                <input type="text" placeholder='username' ref={nameRef} value="david" />
                <p ref={authRef}></p>
                <button onClick={handleJoin}>Join</button>
            </div>
        </main>
    )
}

export default Home