#!/bin/sh
while ! curl http://0.0.0.0:8080/org.geppetto.frontend
do
  echo "Waiting for docker to finish building.";
  docker ps;
  curl -Is "http://0.0.0.0:8080/org.geppetto.frontend"
  curl -Is "http://localhost:8080/org.geppetto.frontend"
  sleep 1
done
echo "$(date) - connected successfully"