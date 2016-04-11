var net = require('net');
var fs = require('fs');

var server = net.createServer();
var sender = null;
var receivers = {};
var invalid_datas = {};
const maxStr = 120;

function log(data){
  try{
  var datetime = new Date();
  fs.open("server.log","a",function(err,fd){
    if(err){
      console.log(err);
    }
    else{
      fs.write(fd,datetime.toString() + ": " + data.toString() + '\r\n');
      fs.close(fd);
    }
  });
  }catch(e){
    console.log(e.message);
  }
}

function Message(props){
  this.req = props.req || "";
  this.seq = props.seq || 0;
  this.message = props.message || "";
}

function createMessage(props){
  return new Message(props || {});
}

console.log("server starts!");
log("server starts!");

server.on("connection",function(client){
  client.id = client.remoteAddress.toString() +　"," + client.remotePort.toString();
  console.log('Connected from client:' + client.id);
  log('Connected from client:' + client.id);

  client.on("data",function(raw_data){
  try{
    var datas = raw_data.toString().split("$$$$");
    for(var index in datas){
      try{
        var data = datas[index];
        if(data==="") break;
        var dataStr = data.toString();
        if(dataStr.length > maxStr){
          dataStr = dataStr.slice(0,maxStr) + "...";
        }
        console.log(client.id + " says, " + dataStr);
        log(client.id + " says, " + dataStr);

        var message;
        try{
          message = JSON.parse(data);
          invalid_datas[client.id] = "";
        }catch(e){
          invalid_datas[client.id] = invalid_datas[client.id] + data.toString();
          message = JSON.parse(invalid_datas[client.id]);
          data = invalid_datas[client.id];
          invalid_datas[client.id] = "";
        }
        if(message.req === "sender"){
          sender = client;
          invalid_datas[client.id] = "";
          client.role = "sender";
          console.log(client.id + " is the sender");
          var temp_info = [];
          for (var id in receivers){
            temp_info.push(receivers[id].id + "is available");
            receivers[id].write(JSON.stringify(createMessage({ req:"info",message:"Sender:" + client.id + " is connected!"}),null,' '));
          }
          client.write(JSON.stringify(createMessage({ req:"ready",message:temp_info.join(",")}),null,' '));
        }
        else if(message.req === "receiver"){
          receivers[client.id] = client;
          client.role = "receiver";
          console.log(client.id + " is a receiver");
          client.write(JSON.stringify(createMessage({ req:"info",message:"You will receive files!"}),null,' '));
        }
        else {
          if(client.role === "sender"){
            if(message.req === "data"){
              var tmp_message = JSON.parse(data);
              var seq = tmp_message.seq;
              var fileName = JSON.parse((tmp_message.message)).title;
              if(seq === 0){
                var tmp_info = [];
                for (var id in receivers){
                  receivers[id].write(data.toString());
                  tmp_info.push(id);
                }
                console.log(fileName + " has been sent to " + tmp_info.join(";"));
                log(fileName + " has been sent to " + tmp_info.join(";"));
              }
              else{
                for (var id in receivers){
                  receivers[id].write(data.toString() + "$$$$");
                }
              }
            }
          }
          else if(client.role == "receiver"){

          }
        }
      }catch(e){

      }
    }
  }catch(e){
    log(e.message);
  }
  });
  client.on("end",function(){
    try{
      if(client.role == "sender"){
        sender = null;
        console.log('Disconnected from the sender: ' + client.id);
        log('Disconnected from the sender: ' + client.id);
        delete invalid_datas[client.id];
      }
      else if(client.role == "receiver" && client.id in receivers){
        console.log('Disconnected from the receiver: ' + client.id);
        log('Disconnected from the server: ' + client.id);
        delete receivers[client.id];
      }
    }catch(e){
      log(e.message);
    }
  });
  client.on("error",function(){
    try{
      if(client.role == "sender"){
        sender = null;
        console.log('Disconnected from the sender: ' + client.id);
        log('Disconnected from the sender: ' + client.id);
        delete invalid_datas[client.id];
      }
      else if(client.role == "receiver" && client.id in receivers){
        console.log('Disconnected from the receiver: ' + client.id);
        log('Disconnected from the server: ' + client.id);
        delete receivers[client.id];
      }
    }catch(e){
      log(e.message);
    }
  });
});

server.listen(9000);
