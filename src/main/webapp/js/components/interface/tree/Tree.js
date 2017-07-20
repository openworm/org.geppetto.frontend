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

		handleClick(event, rowInfo) {
			// By default, on click we expand/collapse the node the node
			if (rowInfo.node.children != undefined && rowInfo.node.children.length > 0) {
				rowInfo.node.expanded = !rowInfo.node.expanded;
				var newTreeData = changeNodeAtPath({ treeData: this.state.treeData, path: rowInfo.path, newNode: rowInfo.node, getNodeKey: ({ treeIndex }) => treeIndex, ignoreCollapsed: false });
				this.updateTreeData(newTreeData);
			}

			// If there is a callback, we use it
			if (this.props.handleClick != undefined) {
				this.props.handleClick(event, rowInfo);
			}
		}

		getNodeProps(rowInfo) {
			var nodeProps = {};
			nodeProps['onClick'] = (event) => this.handleClick(event, rowInfo);

			if (this.props.getButtons != undefined) {
				nodeProps['buttons'] = this.props.getButtons(rowInfo);
			}
			if (rowInfo.node.instance != undefined) {
				nodeProps['style'] = { cursor: 'pointer' };
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
