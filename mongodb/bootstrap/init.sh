#!/bin/bash
set -e

until mongosh --host mongodb:27017 --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; do
  sleep 2
done

mongosh --host mongodb:27017 --eval '
try {
  rs.status()
} catch (e) {
  rs.initiate({
    _id: "rs0",
    members: [{ _id: 0, host: "mongodb:27017" }]
  })
}
'
