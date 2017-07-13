define(function (require) {

	require("./Tree.less");

	var React = require('react');
	var SortableTree = require('react-sortable-tree').default;
	var AbstractComponent = require('../../AComponent');

	return class Tree extends AbstractComponent {

		constructor(props) {
			super(props);

			this.updateTreeData = this.updateTreeData.bind(this);
			this.expandAll = this.expandAll.bind(this);
			this.collapseAll = this.collapseAll.bind(this);
			this.state = {
				treeData: this.props.data,
			};
		}

		updateTreeData(treeData) {
			this.setState({ treeData });
		}

		expand(expanded) {
			this.setState({
				treeData: toggleExpandedForAll({
					treeData: this.state.treeData,
					expanded,
				}),
			});
		}

		expandAll() {
			this.expand(true);
		}

		collapseAll() {
			this.expand(false);
		}

		getNodeProps(rowInfo) {
			var nodeProps = {};
			if (this.props.handleClick != undefined) {
				nodeProps['onClick'] = () => this.props.handleClick(rowInfo);
			}
			if (this.props.getButtons != undefined) {
				nodeProps['buttons'] = this.props.getButtons(rowInfo);
			}
			return nodeProps;
		}

		render() {

			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="treeViewer">
					<SortableTree
						treeData={this.state.treeData}
						canDrag={false}
						rowHeight={40}
						scaffoldBlockPxWidth={22}
						generateNodeProps={rowInfo => (this.getNodeProps(rowInfo))}
						onChange={treeData => this.setState({ treeData })}
					/>
				</div>
			)
		}
	};
});
