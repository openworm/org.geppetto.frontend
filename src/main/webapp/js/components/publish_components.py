#!/usr/bin/python

# Zips up folders in the ./dev directory and places them in org.geppetto.bower
# directory located at source root. Accepts a parameter -v that specifies the version

# Usage: ./publish_components.py -v <version>

import os, sys, json, distutils.core, shutil, glob, zipfile, getopt
from subprocess import call

def zipdir(path, zip):
    for root, dirs, files in os.walk(path):
        for file in files:
            zip.write(os.path.join(root, file))


def main(argv):

    opts, args = getopt.getopt(argv,"v:")

    if len(opts) < 1 or not opts[0][0] == '-v':
        print('./publish_components.py -v <version>')
        sys.exit(2)

    version = opts[0][1]

    print('Z')

    os.chdir('./dev')
    for name in os.listdir('.'):
        if os.path.isdir(name):
            directory = os.path.join('../../../../../../../', 'org.geppetto.bower', version)
            if not os.path.exists(directory):
                os.makedirs(directory)

            filepath = os.path.join(directory, name + '.zip')
            print('Creating ' + filepath)
            zipf = zipfile.ZipFile( filepath, 'w')
            zipdir( name, zipf )
            zipf.close()

if __name__ == "__main__":
    main(sys.argv[1:])