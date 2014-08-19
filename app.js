var etcd = require('nodejs-etcd');

var e = new etcd({
    url: 'https://127.0.0.1:4001'
})

cb = e.generator(
    function () { console.log('An error has occurred')},
    function (result) { console.log('We found the key, it has value ' + result.value)}
)
e.read(
    {key: '/hello'},
    cb
)
