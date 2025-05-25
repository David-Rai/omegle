const express = require('express');
const app = express();
const PORT = process.env.PORT || 1111;
const { Server } = require("socket.io")
const cors = require("cors")
const http = require("http")


app.use(express.json());
app.use(cors())


//creating the socket and the routing instance
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})


//waiting queue
let waiting = []
let roomName = "codexroom"

//soccket handling
io.on("connection", client => {
    console.log(client.id)

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

        waiting[0].emit("create-offer")//saying to generate the offer
        

        io.to(roomName).emit("joined",roomName)//joined message
        
        waiting.pop()//clearing the waiting list
    }


    //WebRTC connection handling
    client.on("offer",({offer,roomName})=>{
        console.log(roomName)
        client.to(roomName).emit("offer",offer)
    })

    //Handling the new ice candidate
    client.on("ice", ({ candidate, roomName }) => {
        io.to(roomName).emit("ice", candidate)
    })
})

//routing
app.get('/', (req, res) => {
    res.send('Hello World');
});

server.listen(PORT, () => {
    console.log(`Server running on port 1111`);
});