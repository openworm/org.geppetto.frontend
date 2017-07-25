#!/bin/sh
while ! curl http://localhost:28081/splash
do
  echo "Waiting for docker to finish building.";
  sleep 60
done
echo "$(date) - connected successfully" && curl -Is "http://localhost:28081/splash"