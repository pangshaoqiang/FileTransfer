# FileTransfer
To send files to other computers through a server machine by TCP.

```sequence
participant receiver1
participant receiver2
participant server
participant sender
receiver1->server:I'm a receiver!
server->receiver1:You will receiver files!
receiver2->server:I'm a receiver!
server->receiver2:You will receiver files!
sender->server:I'm a sender!
server->receiver1:sender is connected!
server->receiver2:sender is connected!
server->sender:receiver1,receiver2 is available!
sender->server:[file "a"]
server->receiver1:[file "a"]
server->receiver2:[file "a"]
server->sender:[file "a"] has sent to receiver1,receiver2
```