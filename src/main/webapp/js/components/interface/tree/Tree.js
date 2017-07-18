define(function (require) {

	require("./Tree.less");

	var React = require('react');
	var SortableTree = require('react-sortable-tree').default;
	var toggleExpandedForAll = require('react-sortable-tree').toggleExpandedForAll;
	var changeNodeAtPath = require('react-sortable-tree').changeNodeAtPath;
	var AbstractComponent = require('../../AComponent');

	return class Tree extends AbstractComponent {

		constructor(props) {
			super(props);

			this.updateTreeData = this.updateTreeData.bind(this);
			this.expandAll = this.expandAll.bind(this);
			this.collapseAll = this.collapseAll.bind(this);
			this.state = {
				treeData: this.props.treeData,
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

		// By default, on click we expand/collapse the node the node
		handleClick(rowInfo) {
			if (rowInfo.node.children != undefined && rowInfo.node.children.length > 0) {
				rowInfo.node.expanded = !rowInfo.node.expanded;
				var newTreeData = changeNodeAtPath({ treeData: this.state.treeData, path: rowInfo.path, newNode: rowInfo.node, getNodeKey: ({ treeIndex }) => treeIndex, ignoreCollapsed: false });
				this.updateTreeData(newTreeData);
			}
		}

		getNodeProps(rowInfo) {
			var nodeProps = {};
			if (this.props.handleClick != undefined) {
				nodeProps['onClick'] = () => this.props.handleClick(rowInfo);
			}
			else {
				nodeProps['onClick'] = () => this.handleClick(rowInfo);
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
						onChange={treeData => this.updateTreeData(treeData)}
					/>
				</div>
			)
		}
	};
});
