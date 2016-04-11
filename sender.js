var net = require('net');
var fs = require('fs');

var port = 9000;
var host = "127.0.0.1";
var path = "";
const maxStr = 120;
var files = [];

process.argv.forEach(function (val,index,array){
  if(index>=2)
    files.push(val);
});

function log(data){
  var datetime = new Date();
  fs.open("sender.log","a",function(err,fd){
    if(err){
      console.log(err);
    }
    else{
      fs.write(fd,datetime.toString() + ": " + data.toString() + '\r\n');
      fs.close(fd);
    }
  })
}

fs.readFile('sender.json', 'utf-8',function (f_err, f_data) {
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

function Message(props){
  this.req = props.req || "";
  this.seq = props.seq || 0;
  this.message = props.message || "";
}

function createMessage(props){
  return new Message(props || {});
}

function sendFile(client,file){
  var tmp_seq = 0;
  var length = file.data.length;
  var tmp_file = {};
  tmp_file.title = file.title;
  log("data:" + file.data);
  log("length:" + length.toString());
  if(length <= 256){
    tmp_file.data = file.data;
    client.write(JSON.stringify(createMessage({ req:"data",seq:0,message:JSON.stringify(tmp_file)}),null,' ')+"$$$$");
  }
  else{
    tmp_seq = 1;
    while(tmp_seq*256 <length){
      tmp_file.data = file.data.substring((tmp_seq-1)*256,tmp_seq*256);
      client.write(JSON.stringify(createMessage({ req:"data",seq:tmp_seq,message:JSON.stringify(tmp_file)}),null,' ')+"$$$$");
      tmp_seq = tmp_seq + 1;
      //log(JSON.stringify(createMessage({ req:"data",seq:tmp_seq,message:JSON.stringify(tmp_file)}),null,' ') +"$$$$");
    }
    tmp_file.data = file.data.substring((tmp_seq-1)*256,length);
    client.write(JSON.stringify(createMessage({ req:"data",seq:0,message:JSON.stringify(tmp_file)}),null,' ')+"$$$$");
    //log(JSON.stringify(createMessage({ req:"data",seq:0,message:JSON.stringify(tmp_file)}),null,' '));
  }
}

function run(){
  var client = net.connect(port,host,()=>{
    console.log('Connected to server!');
    client.write(JSON.stringify(createMessage({ req:"sender"}),null,' '));
  });

  client.on('data',(data)=>{
    var dataStr = data.toString();
    if(dataStr.length > maxStr){
      dataStr = dataStr.slice(0,maxStr) + "...";
    }
    console.log(dataStr);
    log(dataStr);
    var message = JSON.parse(data);
    if(message.req === "ready"){
      if(files.length === 0)
        files.push("sample.txt");
      for(var i in files){
        var afile = files[i];
        fs.readFile(afile, 'utf-8',function (err, data) {
          if (err) {
              console.log(err.toString());
          } else {
              var file = {};
              var args = afile.split(",");
              file.title = args[args.length-1];
              file.data = data;
              sendFile(client,file);
              //client.write(JSON.stringify(createMessage({ req:"data",message:JSON.stringify(file)}),null,' '));
              console.log(file.title + " has been sent!");
              log(file.title + " has been sent!");
          }
        });
      }
    }
    else if(message.req === "received"){
      client.end();
    }
  });
  client.on('end',()=>{
    console.log('Disconnected from server');
    client.end();
  });
  client.on('error',()=>{
    console.log('Disconnected from server');
    client.end();
  });
}
