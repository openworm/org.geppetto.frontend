#!/bin/sh
while ! curl http://0.0.0.0:8080/org.geppetto.frontend
do
  echo "$(date) - still trying";
  docker ps;
  docker-machine ip;
  sleep 1
done
echo "$(date) - connected successfully"
