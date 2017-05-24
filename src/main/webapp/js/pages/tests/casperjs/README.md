## Prereqs

* node.js
* npm

## Install with:

`npm install -g phantomjs casperjs slimerjs`

## Run with

To test that Casper is properly installed:

`casperjs test LiveTests.js --engine=slimerjs` 

To run Geppetto UI Tests:

`casperjs test UITests.js --engine=slimerjs` 

To run Core projects Tests:

`casperjs test --includes=CoreTestsUtility.js CoreTests.js --engine=slimerjs`

## documentation

* [CasperJS Test API documentation](http://docs.casperjs.org/en/latest/modules/tester.html) - assert API
* [CasperJS Core API documentation](http://docs.casperjs.org/en/latest/modules/casper.html) - actions like clicks.
* [Additional command-line options for casperjs](https://docs.slimerjs.org/current/configuration.html#command-line-options) (these can go after `--engine=slimerjs`)