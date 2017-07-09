#!/bin/sh
while ! curl http://0.0.0.0:8080/org.geppetto.frontend
do
  echo "Waiting for docker to finish building.";
  docker ps;
  sleep 1
done
echo "$(date) - connected successfully"
curl -L http://0.0.0.0:8080/org.geppetto.frontend