const avro = require('avsc');

const schema = avro.Type.forSchema({
    type: 'record',
    name: 'Message',
    fields: [
        { name: 'event', type: 'string' },
        {name:'serverID',type:'string'},
        { name: 'UID', type: 'string' },
        {name:'servo',type:'int'},//servo[1,2,3,4]
        { name: 'MessageData', type: 'string' }
    ]
});
module.exports= schema;