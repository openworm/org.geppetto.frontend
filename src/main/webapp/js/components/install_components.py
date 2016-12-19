#!/usr/bin/python

import os
import json
import subprocess
import sys


def load_json(fname):
    with open(fname) as f:
        return json.load(f)

owd = os.getcwd()
os.chdir(os.path.dirname(os.path.abspath(__file__)))

config = load_json('bower.json')

try:
    print(subprocess.check_output(['bower', 'install'],
                                  stderr=subprocess.STDOUT))
except subprocess.CalledProcessError as e:
    print('ERROR: bower install returned:', e.returncode, ':', e.output)
    sys.exit(1)
    
    
with open('components.js', 'w') as componentsfile:
    componentsfile.write('define(function(require) {\n')
    for dependency in config['dependencies']:
        componentConfig = load_json(
            os.path.join('dist', dependency, 'bower.json')).get('main')
        if componentConfig:
            componentsfile.write(
                "require('jsx!./dist/" + dependency + "/" + componentConfig + "');\n")

    componentsfile.write('});')

os.chdir(owd)
