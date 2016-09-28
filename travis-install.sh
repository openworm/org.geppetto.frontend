#!/bin/bash

export main_repo_branch=$TRAVIS_BRANCH
if [[ ${main_repo_branch} != "master" && ${main_repo_branch} != "development" ]]; then main_repo_branch=development ; fi

git clone https://github.com/openworm/org.geppetto.model.git -b $main_repo_branch

if [ $? -eq 0 ]
then
  echo "Successfully cloned org.geppetto.model, branch: "
  echo $main_repo_branch
else
  echo "Failed to clone org.geppetto.model, branch: "
  echo $main_repo_branch
  echo "... it probably doesn't exist"
  echo "Cloning master branch instead"
  git clone https://github.com/openworm/org.geppetto.model.git -b master
fi

cd org.geppetto.model
mvn install
cd ..

git clone https://github.com/openworm/org.geppetto.core.git -b $main_repo_branch

if [ $? -eq 0 ]
then
  echo "Successfully cloned org.geppetto.core, branch: "
  echo $main_repo_branch
else
  echo "Failed to clone org.geppetto.core, branch: "
  echo $main_repo_branch
  echo "... it probably doesn't exist"
  echo "Cloning master branch instead"
  git clone https://github.com/openworm/org.geppetto.core.git -b master
fi

cd org.geppetto.core
mvn install
cd ..

git clone https://github.com/openworm/org.geppetto.simulation.git -b $main_repo_branch

if [ $? -eq 0 ]
then
  echo "Successfully cloned org.geppetto.simulation, branch: "
  echo $main_repo_branch
else
  echo "Failed to clone org.geppetto.simulation, branch: "
  echo $main_repo_branch
  echo "... it probably doesn't exist"
  echo "Cloning master branch instead"
  git clone https://github.com/openworm/org.geppetto.simulation.git -b master
fi

cd org.geppetto.simulation
mvn install
cd ..
