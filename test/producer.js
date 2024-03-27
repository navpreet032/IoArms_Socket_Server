const Kafka = require("node-rdkafka");
const schema = require("../eventType");
console.log("Producer.....")
const Kstream = Kafka.Producer.createWriteStream({
  'metadata.broker.list':'localhost:9092'//ip and port where kafka is running
  },{},{topic:'realyWsUid'});
  
  const sampleData = {
    event:'message',
    sentby: 'User1',
    sentfor: 'User2',
    UID: '123456',
    servo: 1,
    MessageData: 42
  };
  
const sendMSG=()=>{
  const res = Kstream.write(schema.toBuffer(sampleData));
  if(res){
    console.log("Successfully wrote to stream")
  }else{
    console.log("Something went wrong")
  }
}
setInterval(()=>{
  sendMSG();
},3000)