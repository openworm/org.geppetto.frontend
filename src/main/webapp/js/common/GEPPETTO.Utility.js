/**
 * Utility class for helper functions
 */
define(function (require) {
    return function (GEPPETTO) {
        var $ = require('jquery');
        var JSZip = require("jszip");
        var FileSaver = require('file-saver');

        GEPPETTO.Utility = {

            /**
             * Extracts commands from Javascript files. Used by the help method in each object class,
             * where it needs to retrieve commands, but not update existing list as UdateCommands() method.
             *
             * @param script - Script from where to read the commands and comments
             * @param Object - Object from where to extract the commands
             * @param objectName - Name of the object holding commands
             *
             * @returns - Formmatted commands with descriptions
             */
            extractCommandsFromFile: function (script, Object, objectName) {
                //retrieve the script to get the comments for all the methods
                $.ajax({
                    async: true,
                    type: 'GET',
                    url: script,
                    dataType: "text",
                    //at success, read the file and extract the comments
                    success: function (data) {
                        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

                        var commandsFormatted = objectName + GEPPETTO.Resources.COMMANDS;
                        var descriptions = data.match(STRIP_COMMENTS);

                        //find all functions of object Simulation
                        for (var prop in Object) {
                            if (typeof Object[prop] === "function") {
                                var f = Object[prop].toString();
                                //get the argument for this function
                                var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');

                                var functionName = objectName + "." + prop + "(" + parameter + ")";

                                //match the function to comment
                                var matchedDescription = "";
                                for (var i = 0; i < descriptions.length; i++) {
                                    var description = descriptions[i].toString();

                                    //items matched
                                    if (description.indexOf(functionName) != -1) {

                                        /*series of formatting of the comments for the function, removes unnecessary
                                         * blank and special characters.
                                         */
                                        var splitComments = description.replace(/\*/g, "").split("\n");
                                        splitComments.splice(0, 1);
                                        splitComments.splice(splitComments.length - 1, 1);
                                        for (var s = 0; s < splitComments.length; s++) {
                                            var line = splitComments[s].trim();
                                            if (line != "") {
                                                //ignore the name line, already have it
                                                if (line.indexOf("@command") == -1) {
                                                    //build description for function
                                                    matchedDescription += "         " + line + "\n";
                                                }

                                                //ignore the name line, already have it
                                                if (line.indexOf("@returns") != -1) {
                                                    //build description for function
                                                    var match = line.match(/\{.*?\}/);

                                                    if (match != null) {
                                                        if (match[0] == "{String}" && parameter != "") {
                                                            functionName = functionName.replace("(", "(\"");
                                                            functionName = functionName.replace(")", "\")");
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                //format and keep track of all commands available
                                commandsFormatted += ("      -- " + functionName + "\n" + matchedDescription + "\n");
                                //remove last two blank lines
                                commandsFormatted = commandsFormatted.substring(0, commandsFormatted.length - 2)

                            }
                        }

                        GEPPETTO.CommandController.log(commandsFormatted);
                    }
                });

            },

            extractMethodsFromObject: function (object, original) {
                var proto = object.__proto__;
                var methods = [];
                if (original) {
                    proto = object;
                }
                //find all functions of object Simulation
                for (var prop in proto) {
                    if (typeof proto[prop] === "function") {
                        var f = proto[prop].toString();
                        //get the argument for this function
                        var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');

                        var functionName = prop + "(" + parameter + ")";
                        if (GEPPETTO.CommandController.getNonCommands().indexOf(functionName) <= -1) {
                            methods.push(functionName);
                        }
                    }
                }

                return methods;
            },

            formatSelection: function (tree, formattedOutput, indentation) {
                for (var e in tree) {
                    var entity = tree[e];
                    if (entity.selected == true) {
                        formattedOutput = formattedOutput + indentation + entity.id + "\n";
                        indentation = "      ↪";
                    }
                }

                if (formattedOutput.lastIndexOf("\n") > 0) {
                    formattedOutput = formattedOutput.substring(0, formattedOutput.lastIndexOf("\n"));
                }

                return formattedOutput.replace(/"/g, "");
            },

            componentToHex: function (c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            },

            rgbToHex: function (r, g, b) {
                return "0X" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
            },

            getContrast50: function (hexcolor) {
                return (parseInt(hexcolor, 16) > 0xffffff / 2) ? 'black' : 'white';
            },

            getQueryStringParameter: function (name) {
                name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
                var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
                return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
            },

            getPathStringParameters: function () {
                var paths = [];
                var locationPaths = location.pathname.split("/");
                for (var pathIndex in locationPaths) {
                    var locationPath = locationPaths[pathIndex];
                    if (locationPath != 'geppetto' && locationPath != 'org.geppetto.frontend' && locationPath != '') {
                        paths.push(locationPath);
                    }
                }
                return paths;
            },

            persistedAndWriteMessage: function (caller) {
                var message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED;
                if (!GEPPETTO.UserController.isLoggedIn()) {
                    message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + GEPPETTO.Resources.USER_NOT_LOGIN;
                } else {
                    if (!window.Project.persisted && caller.writePermission) {
                        message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED
                            + GEPPETTO.Resources.PROJECT_NOT_PERSISTED;
                    } else if (window.Project.persisted && !caller.writePermission) {
                        message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED
                            + GEPPETTO.Resources.WRITE_PRIVILEGES_NOT_SUPPORTED;
                    } else if (!window.Project.persisted && !caller.writePermission) {
                        message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED +
                            GEPPETTO.Resources.PROJECT_NOT_PERSISTED + " and "
                            + GEPPETTO.Resources.WRITE_PRIVILEGES_NOT_SUPPORTED;
                    }
                }

                return message;
            },

            createZipFromRemoteFiles: function (files, zipName) {
                if (!(files instanceof Array)){
                    files = [files];
                }

                // Convert url to promise, returning uint8 array
                function urlToPromise(url) {
                    return new Promise(function (resolve, reject) {
                        var oReq = new XMLHttpRequest();
                        oReq.open("GET", url, true);
                        oReq.responseType = "arraybuffer";

                        oReq.onload = function (oEvent) {
                            var arrayBuffer = oReq.response;
                            resolve(new Uint8Array(arrayBuffer));
                        };

                        oReq.send();
                    });
                }

                // Add an entry to zip per file
                var zip = new JSZip();
                $.each(files, function (i, filePath) {
                    zip.file(filePath.split('/').pop(), urlToPromise(filePath), { binary: true });
                });

                // Send File
                zip.generateAsync({ type: "blob" })
                    .then(function (blob) {
                        FileSaver.saveAs(blob, zipName);
                    });
            }
        };

        /**
         * Adding method to javascript string class to test if beginning of string matches another string being passed.
         */
        if (typeof String.prototype.startsWith != 'function') {
            String.prototype.startsWith = function (str) {
                return this.substring(0, str.length) === str;
            }
        }

        /**
         * Extend string prototype to enable posh string formatting
         */
        if (!String.prototype.format) {
            String.prototype.format = function () {
                var args = arguments;
                return this.replace(/{(\d+)}/g, function (match, number) {
                    return typeof args[number] != 'undefined' ? args[number] : match;
                });
            };
        }
    };


});
