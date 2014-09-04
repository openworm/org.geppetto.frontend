#!/usr/bin/python

import os, sys, json, distutils.core,subprocess, shutil, glob
from subprocess import call

config = json.loads(open(os.path.join(os.path.dirname(__file__), 'bower.json')).read())
componentsfile = open(os.path.join(os.path.dirname(__file__), 'components.js'),'w')

print subprocess.check_output(['bower','install'])

componentsfile.write('define(function(require) {\n');

for dependency in config['dependencies']:
    componentConfig = json.loads(open(os.path.join(os.path.dirname(__file__), dependency+'/bower.json')).read())

    if 'main' in componentConfig:
        componentsfile.write("require('jsx!./"+dependency+"/"+componentConfig['main']+"');\n")

componentsfile.write('});');
componentsfile.close();