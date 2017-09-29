define(function (require) {

	var React = require('react');
	require("./Panel.less");
	var defaultChildStyle = { 'alignSelf': 'auto', 'flexGrow': 0, 'order': 0 };

	var AbstractComponent = require('../../AComponent');

	return class Panel extends AbstractComponent {

		constructor(props) {
			super(props);

			var defaultParentStyle = { 'flexDirection': 'column', 'justifyContent': 'flex-start', 'alignItems': 'flex-start', 'flexWrap': 'nowrap', 'alignContent': 'flex-start', 'display': 'flex' };
			this.state = {
				parentStyle: $.extend(defaultParentStyle, this.props.parentStyle),
				items: this.props.items
			};
		}

		addChildren(items) {
			this.setState({ items: this.state.items.concat(items) });
		}

		setChildren(items) {
			this.setState({ items: items });
		}

		componentWillReceiveProps(nextProps) {
			this.setState({
				items: nextProps.items
			});
		}

		setDirection(direction) {
			var currentStyle = this.state.parentStyle;
			currentStyle['flexDirection'] = direction;
			this.setState({ parentStyle: currentStyle });
		}

		componentDidMount() {
			var comp = $('#' + this.props.id);
			if (comp.parent().hasClass('dialog')) {
				comp.parent().height(comp.height() + 10);
				comp.parent().parent().width(comp.width() + 70);
			}
		}

		render() {
			var itemComponents = this.state.items.map(function (item) {
				return (<div key={item.props.id} style={defaultChildStyle}>{item}</div>);
			});

			return (
				<div className="panelContainer material" id={this.props.id} style={this.state.parentStyle}>
					{itemComponents}
				</div>
			);
		}
	};
});