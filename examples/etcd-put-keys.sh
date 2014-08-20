#!/bin/bash

curl -sL "http://127.0.0.1:4001/v2/keys/database/mongodb" -XPUT -d 'value=host-x:27017'
curl -sL "http://127.0.0.1:4001/v2/keys/service-x/host-1" -XPUT -d "value=host-1:3000"
curl -sL "http://127.0.0.1:4001/v2/keys/service-x/host-2" -XPUT -d "value=host-1:4000"
curl -sL "http://127.0.0.1:4001/v2/keys/service-x/host-3" -XPUT -d "value=host-2:3000"
curl -sL "http://127.0.0.1:4001/v2/keys/servicea/param1" -XPUT -d 'value=value1'
curl -sL "http://127.0.0.1:4001/v2/keys/servicea/param2" -XPUT -d 'value=value2'
curl -sL "http://127.0.0.1:4001/v2/keys/config/service-a/database" -XPUT -d 'value=/database/mongodb'
curl -sL "http://127.0.0.1:4001/v2/keys/config/service-a/cache" -XPUT -d 'value=/cache/redis'
curl -sL "http://127.0.0.1:4001/v2/keys/config/service-a/servicex" -XPUT -d 'value=/service-x'
curl -sL "http://127.0.0.1:4001/v2/keys/config/service-a/param1" -XPUT -d 'value=/servicea/param1'
curl -sL "http://127.0.0.1:4001/v2/keys/config/service-a/param2" -XPUT -d 'value=/servicea/param2'
