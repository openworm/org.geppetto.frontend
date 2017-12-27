## Prereqs

* node.js
* npm

## Install with:

`npm install -g phantomjs casperjs slimerjs`

## Run with (in this folder):

To test that Casper is properly installed:

`casperjs test LiveTests.js --engine=slimerjs` 

To run UIComponents Tests (Requires NOT having the persistence bundle):

`casperjs test --includes=/utilities/TestsUtility.js UIComponentsTests.js --engine=slimerjs`

To run Geppetto Model Tests (Requires NOT having the persistence bundle):

`casperjs test --includes=/utilities/TestsUtility.js GeppettoModelTests.js --engine=slimerjs`

To run Neuronal Model Projects Tests (Requires NOT having the persistence bundle):

`casperjs test --includes=/utilities/TestsUtility.js,NeuronalTestsLogic.js NeuronalProjectsTests.js --engine=slimerjs`

To run Core default projects Tests (Requires NOT having the persistence bundle) including Neuronal Projects:

`casperjs test --includes=/utilities/TestsUtility.js,NeuronalTestsLogic.js DefaultProjectsTests.js --engine=slimerjs`

To run Persistence Tests (Requires the persistence bundle and a running MySQL server):

`casperjs test --includes=PersistenceTestsLogic.js PersistenceTests.js --engine=slimerjs`

Tests are executed by default on port 8080. If you would like to execute tests on a different port you can change it [here](https://github.com/openworm/org.geppetto.frontend/blob/caspers-qunit/src/main/webapp/js/pages/tests/casperjs/PersistenceTests.js#L3).

To test Gepptto's upload features you'll need to give Geppetto permission to upload to your Dropbox folder. To do this, first
launch Geppetto in the browser and run command 'G.linkDropBox()', a new tab/window will open asking you to sign in to your drop box account and give Geppetto permission. Once you have given Geppetto permission you'll be presented with an access key code, you'll need to copy and past it as the value of 'dropboxcode' argument in the casper test run command.

`casperjs test --includes=PersistenceTestsLogic.js PersistenceTests.js --dropboxcode=accessKey --engine=slimerjs`

If you have an error similar to this one:
`Gecko error: it seems /usr/bin/firefox is not compatible with SlimerJS.`
It may be due to a new version of Firefox not supported by your current Slimer version. You have two options:
- Update Slimerjs and check if it supports latest FireFox
- Change application.ini maximum Firefox version parameter. [Reference](https://github.com/laurentj/slimerjs/issues/495#issuecomment-225008001)

## documentation

* [CasperJS Test API documentation](http://docs.casperjs.org/en/latest/modules/tester.html) - assert API
* [CasperJS Core API documentation](http://docs.casperjs.org/en/latest/modules/casper.html) - actions like clicks.
* [Additional command-line options for casperjs](https://docs.slimerjs.org/current/configuration.html#command-line-options) (these can go after `--engine=slimerjs`)
