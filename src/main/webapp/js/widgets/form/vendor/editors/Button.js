/**
 * Button bar selector for selection of discrete categories
 *
 * see also BootstrapMenuMaker.js
 */

require([ 'widgets/form/vendor/editors/BootstrapMenuMaker' ], function(
        BootstrapMenuMaker) {
    Backbone.Form.editors.Button = Backbone.Form.editors.Base.extend({

        tagName : 'div',
        //className: 'spotlight-toolbar',

        previousValue : '',

        events : {
            'keyup' : 'determineChange',
            'keypress' : function(event) {
                var self = this;
                setTimeout(function() {
                    self.determineChange();
                }, 0);
            },
            'change' : function(event) {
                this.trigger('change', this);
            },
            'focus' : function(event) {
                this.trigger('focus', this);
            },
            'blur' : function(event) {
                this.trigger('blur', this);
            }
        },

        determineChange : function(event) {
            var currentValue = this.getValue();
            var changed = (currentValue !== this.previousValue);

            if (changed) {
                this.previousValue = currentValue;

                this.trigger('change', this);
            }
        },

        getValue : function() {
            return this.value;
            //return this.$('input[type=radio]:checked').val();
        },

        setValue : function(value) {
            this.value = value;
            //		    this.$('input[type=radio]').val([value]);
        },

        focus : function() {
            //		    if (this.hasFocus) return;
            //
            //		    var checked = this.$('input[type=radio]:checked');
            //		    if (checked[0]) {
            //		      checked.focus();
            //		      return;
            //		    }
            //
            //		    this.$('input[type=radio]').first().focus();
        },

        blur : function() {
            //		    if (!this.hasFocus) return;
            //
            //		    this.$('input[type=radio]:focus').blur();
        },

        render : function() {
            this.$el.html(BootstrapMenuMaker.generateToolbar({
                "buttonGroupOne" : this.schema.options
            }));
            return this;
        },

    });

    return Backbone.Form.editors.Button;
});