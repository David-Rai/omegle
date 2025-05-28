const express = require('express');
const app = express();
const PORT = process.env.PORT || 1111;
const { Server } = require("socket.io")
const cors = require("cors")
const http = require("http")


app.use(express.json());
app.use(cors({
    origin: [
        "https://omegla.netlify.app"
        , "https://omegla.netlify.app/"
        , "http://localhost:5173/"
        , "http://localhost:5173"
    ]
}))


//creating the socket and the routing instance
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: [
            "https://omegla.netlify.app"
            , "https://omegla.netlify.app/"
            , "http://localhost:5173/"
            , "http://localhost:5173"
        ]
    }

})


//waiting queue
let waiting = []
let data = {
    waiting,
    number: 0,
    socket_user: []
}
//soccket handling
io.on("connection", client => {
    console.log(client.id)
    data.socket_user.push(client.id)
    data.number += 1

    //if no one exist wait
    if (waiting.length === 0) {
        waiting.push(client)
    }
    //if someone is waiting join
    else {
        const roomName = `${client.id}-${waiting[0].id}`//creating the unique roomName

        console.log(roomName)

        //joining both users into same room
        client.join(roomName)
        waiting[0].join(roomName)

        //storing the room
        client.roomName = roomName
        waiting[0].roomName = roomName

        waiting[0].emit("create-offer")//saying to generate the offer


        io.to(roomName).emit("joined", roomName)//joined message

        waiting.pop()//clearing the waiting list
    }


    //WebRTC connection handling
    client.on("offer", ({ offer, roomName }) => {
        console.log(roomName)
        client.to(roomName).emit("offer", offer)
    })

    //handling the SDP offer creation
    client.on("answer", ({ answer, roomName }) => {
        client.to(roomName).emit("answer", answer)
    })

    //Handling the new ice candidate
    client.on("ice", ({ candidate, roomName }) => {
        io.to(roomName).emit("ice", candidate)
    })

    //stoping the calls
    client.on("stop", ({ roomName }) => {
        client.to(roomName).emit("leaved", "next should be implemented")
    })

    //when any client disconnects notify another
    client.on("disconnect", () => {
        client.to(client.roomName).emit("leaved", "next should be implemented")
    })

    //getting the sended message from peer
    client.on("message", ({ roomName, message, name }) => {
        console.log("message sended", message)
        console.log("message by", name)
        io.to(roomName).emit("message", { message, name })
    })
})

//routing
app.get('/', (req, res) => {
    res.json(data);
});

server.listen(PORT, () => {
    data = {
        waiting,
        number: 0,
        socket_user: []
    }
    console.log(`Server running on port 1111`);
});