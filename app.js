var etcd = require('nodejs-etcd');
var each = require('each');
var e = new etcd({
    url: 'http://127.0.0.1:4001'
})
var config = {}


getConfig("/config/service-a")

function getConfig(configKey) {

    getBaseConfig(configKey, function(options){
        config.options = options;
    });
    getDependencies(configKey + "/dependencies", function(dependencies){
        //iterate over all keys and print the config object.
        //the config object will have a object for each key and the object's value is an array of values
        each(dependencies.keys)
            .parallel( true )
            .on('item', function(element, index, next) {
                getEtcdKeyValue(element, next);
            })
            .on('end', function(){
                console.log(JSON.stringify(config, null, 2));
            });

        each(dependencies.keys)
            .parallel( true )
            .on('item', function(element, index, next) {
                watchEtcdKey(element, next);
            })
            .on('end', function(){
                //console.log("Etcd watches set");
            });

    });


};


//get dependencies and their values from etcd
function getBaseConfig(key, cb){
    //console.log("getBaseConfig('%s')", key);
    e.read({'key': key, 'recursive':true}, function (err, result, body) {
        if (err) throw err;

        body=JSON.parse(result.body);

        //check for errors
        if(body && body.errorCode > 0){
            throw new err({ "err":{"code":body.errorCode, "message": body.message , "cause": body.cause}});
        }
        //read dir node values except for dependencies dir
        var options = {};
        if (body.node.dir){
            for (var i=body.node.nodes.length; i--; ) {
                if (!body.node.nodes[i].dir && body.node.key.indexOf('/dependencies') < 0) {
                    var optName = body.node.nodes[i].key;
                    optName = optName.substring(optName.lastIndexOf('/') + 1);
                    var optValue = body.node.nodes[i].value;
                    options[optName] = optValue;
                }
            }
        }
        return cb(options);
    });
}
//get dependencies and their values from etcd
function getDependencies(key, cb){

    e.read({'key': key, 'recursive':true}, function (err, result, body) {
        if (err) throw err;
        body=JSON.parse(result.body);

        //check for errors
        if(body && body.errorCode > 0){
            throw new err({ "err":{"code":body.errorCode, "message": body.message , "cause": body.cause}});
        }

        //read dir node values
        var dependencies = {keys:[]};
        if (body.node.dir){
            for (var i=body.node.nodes.length; i--; ) {
                if (!body.node.nodes[i].dir) {
                    var depName = body.node.nodes[i].key;
                    depName = depName.substring(depName.lastIndexOf('/') + 1);
                    var depKey = body.node.nodes[i].value;
                    var dependency = {"name":depName, "key":depKey};
                    dependencies.keys.push(dependency);
                }
            }
        }
        return cb(dependencies);
    });
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

//writes key/values to the config object
function setConfig(name, value, prevValue){
    //if key does not exist create it
    if (!config.dependencies) config.dependencies = {};
    if (!config.dependencies[name]) config.dependencies[name] = [];

    //if value exists then update, otherwise insert
    for (var i=config.dependencies[name].length; i--; ) {
        if (config.dependencies[name][i] == prevValue) {
            config.dependencies[name][i] = value;
            return true;
        }
    }
    config.dependencies[name].push(value);
    return true;
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
