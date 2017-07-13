define(function (require) {
	return {
		tplSandbox : '<div class="output"></div><div class="input"><textarea rows="1" id="commandInputArea" placeholder="<%= placeholder %>"></textarea></div>',
		tplCommand: '<% if (! _hidden) { %><div><span class="command"><%= command %></span></div><div><span class="prefix"><%= this.resultPrefix %></span><span class="<%= _class %>"><%= result %></span></div><% } %>',
		tplDebug: '<span class="<%= _class %>"><%= result %></span>'
	}
});