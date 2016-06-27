#!/bin/bash

git clone https://github.com/openworm/org.geppetto.model.git -b $TRAVIS_BRANCH

if [ $? -eq 0 ]
then
  echo "Successfully cloned org.geppetto.model, branch: "
  echo $TRAVIS_BRANCH
else
  echo "Failed to clone org.geppetto.model, branch: "
  echo $TRAVIS_BRANCH
  echo "... it probably doesn't exist"
  echo "Cloning master branch instead"
  git clone https://github.com/openworm/org.geppetto.model.git -b master
fi

cd org.geppetto.model
mvn install
cd ..

git clone https://github.com/openworm/org.geppetto.core.git -b $TRAVIS_BRANCH

if [ $? -eq 0 ]
then
  echo "Successfully cloned org.geppetto.core, branch: "
  echo $TRAVIS_BRANCH
else
  echo "Failed to clone org.geppetto.core, branch: "
  echo $TRAVIS_BRANCH
  echo "... it probably doesn't exist"
  echo "Cloning master branch instead"
  git clone https://github.com/openworm/org.geppetto.core.git -b master
fi

cd org.geppetto.core
mvn install
cd ..

git clone https://github.com/openworm/org.geppetto.simulation.git -b $TRAVIS_BRANCH

if [ $? -eq 0 ]
then
  echo "Successfully cloned org.geppetto.simulation, branch: "
  echo $TRAVIS_BRANCH
else
  echo "Failed to clone org.geppetto.simulation, branch: "
  echo $TRAVIS_BRANCH
  echo "... it probably doesn't exist"
  echo "Cloning master branch instead"
  git clone https://github.com/openworm/org.geppetto.simulation.git -b master
fi

cd org.geppetto.simulation
mvn install
cd ..
