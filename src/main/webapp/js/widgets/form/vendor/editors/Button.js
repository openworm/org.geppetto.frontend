/**
 * Radio editor
 *
 * Renders a <ul> with given options represented as <li> objects containing radio buttons
 *
 * Requires an 'options' value on the schema.
 *  Can be an array of options, a function that calls back with the array of options, a string of HTML
 *  or a Backbone collection. If a collection, the models must implement a toString() method
 */

require(['widgets/form/vendor/editors/BootstrapMenuMaker'],function(BootstrapMenuMaker){
    Backbone.Form.editors.Button = Backbone.Form.editors.Base.extend({

          tagName: 'div',
          //className: 'spotlight-toolbar',

          previousValue: '',

          events: {
            'keyup':    'determineChange',
            'keypress': function(event) {
              var self = this;
              setTimeout(function() {
                self.determineChange();
              }, 0);
            },
            'change': function(event) {
              this.trigger('change', this);
            },
            'focus':  function(event) {
              this.trigger('focus', this);
            },
            'blur':   function(event) {
              this.trigger('blur', this);
            }
          },

          determineChange: function(event) {
            var currentValue = this.getValue();
            var changed = (currentValue !== this.previousValue);

            if (changed) {
              this.previousValue = currentValue;

              this.trigger('change', this);
            }
          },

          /**
           * Returns the template. Override for custom templates
           *
           * @return {Function}       Compiled template
           */
          getTemplate: function() {
            return this.schema.template || this.constructor.template;
          },

          getValue: function() {
            return this.value;
              //return this.$('input[type=radio]:checked').val();
          },

          setValue: function(value) {
            this.value = value;
//		    this.$('input[type=radio]').val([value]);
          },

          focus: function() {
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

          blur: function() {
//		    if (!this.hasFocus) return;
        //
//		    this.$('input[type=radio]:focus').blur();
          },

          render: function() {
                this.$el.html(BootstrapMenuMaker.generateToolbar({"buttonGroupOne": this.schema.options}));


                return this;
              },



        });

    return Backbone.Form.editors.Button;
});