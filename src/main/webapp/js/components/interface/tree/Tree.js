define(function (require) {

	require("./Tree.less")

	var React = require('react');
	var SortableTree = require('react-sortable-tree').default;
	var AbstractComponent = require('../../AComponent');

	return class Tree extends AbstractComponent {

		constructor(props) {
			super(props);

			this.handleClick = this.handleClick.bind(this);
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

		// download() {
		// 	//What do we do here?
		// 	console.log("Downloading data...");
		// }

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

		handleClick(rowInfo) {
			console.log('taka');
			console.log(rowInfo);
		}
		getButtons(rowInfo) {
			var buttons = [];
			if (rowInfo.node.children == undefined || rowInfo.node.children.length == 0){
				buttons.push(<i className="fa fa-eye" aria-hidden="true" onClick={() => this.handleClick(rowInfo)}></i>);
			}
			return buttons;
		}

		render() {
			return (
				<div key={this.props.id + "_component"} id={this.props.id + "_component"} className="treeViewer">
					<SortableTree
						treeData={this.state.treeData}
						canDrag={false}
						generateNodeProps={rowInfo => ({

							onClick: () => this.handleClick(rowInfo),
							buttons: this.getButtons(rowInfo),
						})}
						onChange={treeData => this.setState({ treeData })}
					/>
				</div>
			)
		}
	};
});
