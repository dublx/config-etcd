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

each(etcdKeys.keys)
    .parallel( true )
    .on('item', function(element, index, next) {
        watchEtcdKey(element, next);
    })
    .on('end', function(){
        console.log("Etcd watches set");
    });


//writes key/values to the config object
function setConfig(name, value, prevValue){
    //if key does not exist create it
    if (!config[name]) config[name] = [];

    //if value exists then update, otherwise insert
    for (var i=config[name].length; i--; ) {
        if (config[name][i] == prevValue) {
            config[name][i] = value;
            return true;
        }
    }
    config[name].push(value);
    return true;
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

//watch etcd key for changes
function watchEtcdKey(item, cb){
    e.read({'key': item.key, 'recursive':true, 'wait':true}, function (err, result, body) {
        if (err) throw err;
        body=JSON.parse(result.body);

        //check for errors
        if(body && body.errorCode > 0){
            setConfig(item.name, { "err":{"code":body.errorCode, "message": body.message , "cause": body.cause}});
        }

        //read node value or iterate first depth of nodes and read their values
        if(!body.node.dir){
            setConfig(item.name, body.node.value, body.prevNode.value);
        }else{
            if (body.node.dir){
                for (var i=body.node.nodes.length; i--; ) {
                    if (!body.node.nodes[i].dir) setConfig(item.name, body.node.nodes[i].value, body.node.nodes[i].prevNode.value);
                }
            }else{
                setConfig(item.name, { "err":{"code":body.errorCode, "message": body.message , "cause": body.cause}});
            }
        }
        console.log(JSON.stringify(config, null, 2));
        //create new watch for subsequent changes
        watchEtcdKey(item);

    });

    if(cb) return cb();
    return;

}
