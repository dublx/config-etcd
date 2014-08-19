var etcd = require('nodejs-etcd');
var etcdKeys = require('./etcd.json');

var e = new etcd({
    url: 'http://127.0.0.1:4001'
})
//
//cb = e.generator(
//    function () { console.log('An error has occurred')},
//    function (result) { console.log(result.value)}
//)
//e.read(
//    {key: '/hello'},
//    cb
//)

etcdKeys.keys.forEach(function (item){
    console.log(item);
    e.read({'key': item.key}, function (err, result, body) {
        if (err) throw err;
        body = JSON.parse(result.body);
        console.log(body.node.value);
    });
});

