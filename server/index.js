const express = require('express');
const app = express();
const PORT = process.env.PORT || 1111;
const {Server}=require("socket.io")
const cors=require("cors")
const http=require("http")


app.use(express.json());
app.use(cors())


//creating the socket and the routing instance
const server=http.createServer(app)
const io=new Server(server,{
    cors:{
     origin:"*"   
    }
})

io.on("connection",client=>{
    console.log(client.id)
})
app.get('/', (req, res) => {
  res.send('Hello World');
});

server.listen(PORT, () => {
  console.log(`Server running on port 1111`);
});