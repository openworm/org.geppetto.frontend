define(function (require) {
	return {
		tplContextMenu: '',
		tplContextMenuItems: '<li id="<%= this.cid %>"><% if (icon != null && icon != undefined) { %><i class="<%= icon %>" id="<%= this.cid %>"></i><% } %> <%= label %></li>',
	}
});