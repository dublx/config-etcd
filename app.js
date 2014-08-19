var etcd = require('nodejs-etcd');
var etcdKeys = require('./etcdKeys.json');
var each = require('each');
var e = new etcd({
    url: 'http://127.0.0.1:4001'
})
var config = {}

//iterate over all keys and print the config object.
//the config object will have a object for each key and the object's value is an array of values
each(etcdKeys.keys)
    .parallel( true )
    .on('item', function(element, index, next) {
        getEtcdKeyValue(element, next);
    })
    .on('end', function(){
        console.log(JSON.stringify(config, null, 2));
    });

//writes key/values to the config object
function setConfig(name,value){
    if (!config[name]) config[name] = [];
    config[name].push(value);
}

//read key from etcd
function getEtcdKeyValue(item, cb){
    e.read({'key': item.key, 'recursive':true}, function (err, result, body) {
        if (err) throw err;
        body=JSON.parse(result.body);

        //check for errors
        if(body && body.errorCode > 0){
            setConfig(item.name, { "err":{"code":body.errorCode, "message": body.message , "cause": body.cause}});
            return cb();
        }

        //read node value or iterate first depth of nodes and read their values
        if(!body.node.dir){
            setConfig(item.name, body.node.value);
        }else{
            if (body.node.dir){
                for (var i=body.node.nodes.length; i--; ) {
                    if (!body.node.nodes[i].dir) setConfig(item.name, body.node.nodes[i].value);
                }
            }else{
                setConfig(item.name, { "err":{"code":body.errorCode, "message": body.message , "cause": body.cause}});
            }
        }
        return cb();
    });
}
