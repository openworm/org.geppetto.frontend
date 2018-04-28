/**
 * React component for displaying a drawer.
 *
 * @author Dario Del Piano (dario@metacell.us)
 */

define(function (require) {

  require('./DrawerExtension.less');

  var React = require('react');
  var GeppettoDrawer = require('./GeppettoDrawer');

  class DrawerExtension extends React.Component {
    constructor() {
      super();
    }

    render() {
      return (
        <GeppettoDrawer content={this.props.labels}>
          {this.props.children}
        </GeppettoDrawer>
      );
    }
  }
  return DrawerExtension;
});