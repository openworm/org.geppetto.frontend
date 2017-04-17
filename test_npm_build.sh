#!/bin/bash

cd src/main/webapp
npm install
npm run build-dev  -- --contextPath=org.geppetto.frontend --useSsl=false --embedded=false --embedderURL=/
npm run build -- --contextPath=/ --useSsl=true --embedded=false --embedderURL=/
cd -