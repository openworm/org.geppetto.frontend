#!/bin/sh
while curl -s -o /dev/null -w "%{http_code}" http://localhost:28081/org.geppetto.frontend == 404 or curl -s -o /dev/null -w "%{http_code}" http://localhost:28081/org.geppetto.frontend == 000
do 
  echo "Waiting for url host to be up.";
  sleep 60
done
echo "$(date) - connected successfully" && curl -Is "http://localhost:28081/org.geppetto.frontend"