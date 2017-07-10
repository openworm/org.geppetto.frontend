#!/bin/sh
while ! curl http://localhost:28081/org.geppetto.frontend
do
  echo "Waiting for docker to finish building.";
  docker ps;
  curl -Is "http://localhost:28081/org.geppetto.frontend"
  curl -Is "http://localhost:28081/org.geppetto.frontend"
  sleep 1
done
echo "$(date) - connected successfully" && curl -Is "http://localhost:28081/org.geppetto.frontend"