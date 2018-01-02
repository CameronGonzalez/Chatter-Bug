var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var client = io.sockets;

server.listen(process.env.PORT||3000);

console.log('server running...');

app.get('/',function(req,res){
    res.sendfile(__dirname + '/index.html');
});

const mongo = require('mongodb').MongoClient;

//connect to mongodb
mongo.connect('database URL',function(err,db){
    if(err){
        throw err;
    }
    console.log('connection successful');

    //connect to socket.io
    client.on('connection',function(socket){
        let chat=db.collection('chats');

        //create function to send status 
        sendStatus = function(s){
            socket.emit('status',s);
        }

        //get chats from mongo collection
        chat.find().sort({_id:1}).toArray(function(err,res){
            if(err){
                throw err;
            }
            //emit messages
            socket.emit('output',res);
        });

        //handle input events
        socket.on('input',function(data){
            let name=data.name;
            let message=data.message;

            //check for name and message
            if(name==''||message==''){
                //send error status
                sendStatus('Please enter both a name and a message');
            }
            else{
                //insert message
                chat.insert({name:name,message:message},function(){
                    client.emit('output',[data]);

                    //send status object
                    sendStatus({
                        clear:true
                    });
                });
            }
        });
    });
});