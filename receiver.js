var net = require('net');
var fs = require('fs');

var port = 9000;
var host = "127.0.0.1";
var path = "";
const maxStr = 120;
var files = {};
var invalid_data = "";

function log(data){
  var datetime = new Date();
  fs.open("receiver.log","a",function(err,fd){
    if(err){
      console.log(err);
    }
    else{
      fs.write(fd,datetime.toString() + ": " + data.toString() + '\r\n');
      fs.close(fd);
    }
  })
}

function Message(props){
  this.req = props.req || "";
  this.seq = props.seq || 0;
  this.message = props.message || "";
}

function createMessage(props){
  return new Message(props || {});
}

fs.readFile('receiver.json', 'utf-8',function (f_err, f_data) {
  if (f_err) {
    console.log(f_err.toString());
    log(f_err);
  } else {
    console.log(f_data);
    var conf = JSON.parse(f_data);
    port = conf.port || 9000;
    host = conf.host || "127.0.0.1";
    path = conf.path || "";
    run();
  }
});

function run(){
  var client = net.connect(port,host,()=>{
    console.log('Connected to server:' + host +"," + port);
    log('Connected to server:' + host +"," + port);
    client.write(JSON.stringify(createMessage({ req:"receiver"}),null,' '));
  });

  client.on('data',(raw_data)=>{
    try{
      var datas = raw_data.toString().split("$$$$");
      for(var index in datas){
        var data = datas[index];
        if(data=="")
          break;
        var dataStr = data.toString();
        if(dataStr.length > maxStr){
          dataStr = dataStr.slice(0,maxStr) + "...";
        }
        console.log(dataStr);
        log(dataStr);
        var message;
        try{
          message = JSON.parse(data);
        }catch(e){
          invalid_data = invalid_data + data.toString();
          message = JSON.parse(invalid_data);
          data = invalid_data;
          invalid_data = "";
        }
        if(message.req === undefined)
          return;
        if(message.req === "data"){
          var file = JSON.parse(message.message);
          var tmp_file;
          if(file.title in files){
            tmp_file = files[file.title];
            tmp_file.data = tmp_file.data + file.data;
          }
          else{
            files[file.title] = file;
            tmp_file = file;
          }
          if(message.seq === 0){
            fs.writeFile(path + tmp_file.title,tmp_file.data,function(err){
              if(err){
                console.log(err);
              }else{
                console.log(tmp_file.title + ' write ok!');
                log(tmp_file.title + ' write ok!');
              }
            });
            delete files[tmp_file.title];
          }
        }
      }
    }catch(e){
      console.log(e.message);
      log(e.message);
    }
  });
  client.on('end',()=>{
    console.log('Disconnected from server');
    log('Disconnected from server');
    client.end();
  });
  client.on('error',()=>{
    console.log('Disconnected from server');
    log('Disconnected from server');
    client.end();
  });
  client.on('close',()=>{
    client.end();
  });
}
