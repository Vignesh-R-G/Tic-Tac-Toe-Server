const express=require('express')
const http=require('http')
const {Server}=require('socket.io')
const cors=require('cors')
require('dotenv/config')

const app=express()

const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:"*"
    }
})

let room=[]  // consist of entire player and room information
let random=[] // for checking whether the random room exist
let randomRooms=[] // consist of entire room and player information
let allRooms=[] // for checking whether the room exist

io.on('connect',(socket)=>{
    console.log(`${socket.id} Connected`)

    socket.on('createroom',(data)=>{
        console.log('Room Created with Id : '+data.roomid)
        allRooms=[...allRooms,data.roomid]
    })

    socket.on('joinroom',(data)=>{
        console.log(data.roomid) 
        if(allRooms.includes(data.roomid)){
            const lst=[]
            let isExist=false
            let isRoomFull=false
            let playerinfo='X'

            // To check if the room already exist
            let rooms=room.map((x)=>{

                // To check if the room is full
                if(x.roomid===data.roomid && x.player.length===2){
                    console.log('Room Full')
                    console.log(room)
                    socket.emit('alertforroomfull','Room is Full')
                    isRoomFull=true
                }

                else if(x.roomid===data.roomid){
                    // to check whether X or O exist in the room
                    if(x.player[0].playerinfo==='X'){
                        playerinfo='O'
                    }
                    else{
                        playerinfo='X'
                    }

                    const playerInfo={
                        socketid:socket.id,
                        playerinfo:playerinfo
                    }
                    x.player=[...x.player,playerInfo]
                    isExist=true
                }
                return x

            })

            //To add the new player to a new room
            if(!isExist && !isRoomFull){
                const playerInfo={
                    socketid:socket.id,
                    playerinfo:playerinfo
                }
                const info={
                    roomid:data.roomid,
                    player:[...lst,playerInfo],
                }
                room.push(info)
                socket.join(data.roomid)
                console.log(room)
                console.log(`${data.name} joined ${data.roomid}`)
                io.in(data.roomid).emit('cangamestart',false)
                socket.emit('playerdetails',playerInfo.playerinfo)
            }

            // To add the new player to an existing room
            else if(isExist && !isRoomFull){
                room=[...rooms]
                socket.join(data.roomid)
                console.log(room)
                console.log(`${data.name} joined ${data.roomid}`)
                io.in(data.roomid).emit('cangamestart',true)
                socket.emit('playerdetails',playerinfo)
            }
        }
        else{
            console.log(allRooms)
            socket.emit('isroomexist','Room Does Not Exist')
        }

    })

    socket.on('randomroom',(data)=>{
        let isRoomExist=false
        let roomid=0
        let playerinfo='X'
        const lst=[]

        randomRooms.map((x)=>{
            if(x.player.length<2){
                isRoomExist=true
                roomid=x.roomid
            }
        })

        if(!isRoomExist){

            const min = 100000
            const max = 999999
            let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min
            let randomNumberInString=randomNumber.toString()
            random=[...random,randomNumberInString]
            
            const playerInfo={
                socketid:socket.id,
                playerinfo:playerinfo
            }
            const info={
                roomid:randomNumberInString,
                player:[...lst,playerInfo]
            }

            randomRooms=[...randomRooms,info]
            console.log(randomRooms)

            const data={
                playerinfo:playerinfo,
                roomid:randomNumberInString,
            }
            socket.join(randomNumberInString)
            io.in(roomid).emit('cangamestart',false)
            socket.emit('randomroomdetails',data)
        }

        else{
            socket.join(roomid)
            const room=randomRooms.map((x)=>{
                if(x.roomid===roomid){

                    if(x.player[0].playerinfo==='X'){
                        playerinfo='O'
                    }
                    else{
                        playerinfo='X'
                    }

                    const playerInfo={
                        socketid:socket.id,
                        playerinfo:playerinfo
                    }
                    const l=[...x.player]
                    x.player=[...l,playerInfo]
                } 
                return x
            })
            randomRooms=[...room]
            const data={
                playerinfo:playerinfo,
                roomid:roomid,
                cangamestart:true
            }
            console.log(randomRooms)
            io.in(roomid).emit('cangamestart',true)
            socket.emit('randomroomdetails',data)
        }
    })



    socket.on('updateboard',(data)=>{
        io.in(data.roomid).emit('updatedboard',data)
    })

    socket.on('sendmessage',(data)=>{
        io.in(data.roomid).emit('receivemessage',data)
    })

    socket.on('disconnect',()=>{
        let rooms=room.map((x)=>{
            let playerscopy=[]
            x.player.map((y,index)=>{
                if(y.socketid!==socket.id){
                    playerscopy.push(y)
                }
            })
            x.player=[...playerscopy]
            return x
        })
        room=[...rooms]

        let randomrooms=randomRooms.map((x)=>{
            let playerscopy=[]
            x.player.map((y,index)=>{
                if(y.socketid!==socket.id){
                    playerscopy.push(y)
                }
            })
            x.player=[...playerscopy]
            return x
        })
        randomRooms=[...randomrooms]

        // to remove the room where the player was empty
        const l1=[]
        room.map((x)=>{
            if(x.player.length!==0){
                l1.push(x)
            }
        })
        room=[...l1]

        const l2=[]
        randomRooms.map((x)=>{
            if(x.player.length!==0){
                l2.push(x)
            }
        })
        randomRooms=[...l2]

        console.log(randomRooms)
        console.log(room)

        console.log(`${socket.id} Disconnected`)
    })
})

const PORT=process.env.PORT
server.listen(PORT,()=>{
    console.log('Server started at PORT : '+PORT)
})