define({
                named: function (constructor, name, def) {
                    return constructor.bind(this)(def).attr('id', name);
                },

                createLabel: function (button) {
                    return $("<div>").addClass('spotlight-button-label').html(button.label);
                },

                createButtonCallback: function (button) {
                    return function () {
                        button.actions.forEach(function (action) {
                            GEPPETTO.Console.executeCommand(action);
                        });
                    };
                },

                createButton: function (button) {
                    var btn =  $('<button>')
                        .addClass('btn btn-default btn-lg fa spotlight-button')
                        .addClass(button.icon)
                        .append(this.createLabel(button))
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', button.tooltip)
                        .attr('container', 'body');
                    if (button.actions){
                    	button.on('click', this.createButtonCallback(button));
                    }
                    return btn;
                },

                createButtonGroup: function (bgName, bgDef) {
                    var that = this;
                    var bg = $('<div>')
                        .addClass('btn-group')
                        .attr('role', 'group')
                        .attr('id', bgName);
                    $.each(bgDef, function (bName, bData) {
                        bg.append(that.named(that.createButton, bName, bData));
                    });
                    return bg;
                },

                generateToolbar: function (buttonGroups) {
                    var that = this;
                    var tbar = $('<div>').addClass('toolbar');
                    $.each(buttonGroups, function (groupName, groupDef) {
                        tbar.append(that.createButtonGroup(groupName, groupDef));
                    });
                    return tbar;
                }
            });