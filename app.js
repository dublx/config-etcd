var etcd = require('nodejs-etcd');
var etcdKeys = require('./etcdKeys.json');
var each = require('each');
var e = new etcd({
    url: 'http://127.0.0.1:4001'
})
var config = {}

each(etcdKeys.keys)
    .parallel( true )
    .on('item', function(element, index, next) {
        getEtcdKeyValue(element, next);
    })
    .on('end', function(){
        console.log(JSON.stringify(config, null, 2));
    });

function setConfig(name,value){
    if (!config[name]) config[name] = [];
    config[name].push(value);
}

function getEtcdKeyValue(item, cb){
    e.read({'key': item.key, 'recursive':true}, function (err, result, body) {
        if (err) throw err;
        body = JSON.parse(result.body);
        if(!body.errorCode && !body.node.dir){
            setConfig(item.name, body.node.value);
        }else{
            if (body.node.dir){
                for (var i=body.node.nodes.length; i--; ) {
                    setConfig(item.name, body.node.nodes[i].value);
                }
            }else{
                setConfig(item.name, { "err":{"code":body.errorCode, "message": body.message , "cause": body.cause}});
            }
        }
        cb();
    });
}

