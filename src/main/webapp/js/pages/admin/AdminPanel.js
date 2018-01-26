define(function (require) {

    require('./AdminPanel.less');

    var React = require('react');
    var Griddle = require('griddle-0.6-fork');

    var LinkComponent = React.createClass({
        render: function () {

            var displayText = this.props.data;
            var that = this;

            var action = function (e) {
                e.preventDefault();
            };

            var linkDisabled = "";
            if (displayText != "Show Size" && displayText != "ERROR") {
                linkDisabled = "linkDisabled";
            }

            return (
                <div>
                    <a href='#' onClick={action} className={linkDisabled}>{displayText}</a>
                </div>
            )
        }
    });

    var ButtonComponent = React.createClass({

        render: function () {
            var addClass = "";
            if (this.props.selectedState) {
                addClass = "selected ";
            }
            return (
                <button id={this.props.id} type="button" className={addClass + "button"}
                        onClick={this.props.onClick}>{this.props.id}</button>
            );
        }
    });

    var DateDisplay = React.createClass({
        render: function () {
            var options = {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC', timeZoneName: 'short'};
            var formattedDate = new Date(this.props.data).toLocaleString('en-US', options);
            return (
               <div>{ formattedDate }</div>
            )
        }
    });

    var adminPanelComponent = React.createClass({
        user: "admin",
        resultsPerPage: 20,
        usersViewSelected: true,
        simulationsViewSelected: false,
        lastDaySelected: false,
        lastWeekSelected: true,
        lastMonthSelected: false,
        allTimeSelected: false,
        currentView: null,
        timeFrame: "week",
        storedData: [],
        views: ["Users", "Simulations"],
        usersColumnMeta: [
            {
                "columnName": "login",
                "order": 1,
                "locked": false,
                "displayName": "User Name"
            },
            {
                "columnName": "name",
                "order": 2,
                "locked": false,
                "displayName": "Name"
            },
            {
                "columnName": "loginCount",
                "order": 4,
                "locked": false,
                "displayName": "Login Count"
            },
            {
                "columnName": "lastLogin",
                "order": 3,
                "locked": false,
                "sortDirectionCycle": ["desc", "asc"],
                "displayName": "Last Login"
            },
            {
                "columnName": "projects",
                "order": 5,
                "locked": false,
                "displayName": "Number of Projects"
            },
            {
                "columnName": "experiments",
                "order": 6,
                "locked": false,
                "displayName": "Number of Experiments"
            },
            {
                "columnName": "storage",
                "customComponent": LinkComponent,
                "order": 7,
                "locked": false,
                "displayName": "Storage Size"
            }],
        simulationsColumnMeta: [
            {
                "columnName": "login",
                "order": 1,
                "locked": false,
                "displayName": "Username"
            },
            {
                "columnName": "name",
                "order": 2,
                "locked": false,
                "displayName": "Name"
            },
            {
                "columnName": "project",
                "order": 3,
                "locked": false,
                "displayName": "Project Name"
            },
            {
                "columnName": "experiment",
                "order": 4,
                "locked": false,
                "displayName": "Experiment Name"
            },
            {
                "columnName": "experimentLastRun",
                "customComponent": DateDisplay,
                "order": 5,
                "locked": false,
                "displayName": "Experiment Last Time Run"
            },
            {
                "columnName": "simulator",
                "order": 6,
                "locked": false,
                "displayName": "Simulator Name"
            },
            {
                "columnName": "status",
                "customComponent": LinkComponent,
                "order": 7,
                "locked": false,
                "displayName": "Experiment Status"
            },
            {
                "columnName": "error",
                "order": 8,
                "locked": false,
                "visible": false,
                "displayName": "Experiment Error"
            }],
        errorColumns: ['login', 'name', 'project', 'experiment', 'experimentLastRun', 'simulator', 'status'],
        columnMeta: [],

        getInitialState: function () {
            return {
                columns: [],
                data: [],
                loaded: false
            }
        },

        setPanelView: function () {
            this.forceUpdate();
        },

        componentDidMount: function () {
            this.setInitialData();
        },

        //sets initial data view when component mounts
        setInitialData: function () {
            var that = this;
            var urlData = window.location.href.replace("admin", "");
            urlData += "user/admin/users/" + this.timeFrame;
            $.ajax({
                url: urlData, success: function (result) {
                    that.setDataSet(that.views[0]);
                }
            });
        },

        //switches the data set to show in component
        setDataSet: function (mode) {
            var that = this;
            var urlData = window.location.href.replace("admin", "");
            var newColumns;

            if (mode == this.views[0]) {
                urlData += "user/" + this.user + "/users/" + this.timeFrame;
                this.setDataViewFlags(true, false);
                this.columnMeta = this.usersColumnMeta;
                newColumns = [];
            } else if (mode == this.views[1]) {
                urlData += "user/" + this.user + "/simulations/" + this.timeFrame;
                this.setDataViewFlags(false, true);
                this.columnMeta = this.simulationsColumnMeta;
                newColumns = this.errorColumns;
            }

            this.currentView = mode;
            this.setState({loaded: false});

            var timeFrame = this.timeFrame;
            if (this.storedData[this.currentView + "/" + timeFrame] == null) {
                $.ajax({
                    url: urlData, success: function (result) {
                        that.storedData[that.currentView + "/" + timeFrame] = result;
                        that.setState({data: result, columnMeta: that.columnMeta, loaded: true, columns: newColumns});
                    }
                });
            } else {
                this.setState({
                    data: this.storedData[this.currentView + "/" + timeFrame],
                    columnMeta: this.columnMeta,
                    loaded: true,
                    columns: newColumns
                });
            }
        },

        //toggle flags that keep track of what's being displayed
        setDataViewFlags: function (user, simulation) {
            this.usersViewSelected = user;
            this.simulationsViewSelected = simulation;
        },

        //toggle flags that keep track of what's being displayed
        setDataTimeFlags: function (day, week, month, allTime) {
            this.lastDaySelected = day;
            this.lastWeekSelected = week;
            this.lastMonthSelected = month;
            this.allTimeSelected = allTime;
        },

        changeViewData: function (view) {
            this.setDataSet(view);
        },

        changeTimeData: function (timeFrame) {
            this.timeFrame = timeFrame;
            if (timeFrame == "all") {
                this.setDataTimeFlags(false, false, false, true);
            } else if (timeFrame == "day") {
                this.setDataTimeFlags(true, false, false, false);
            } else if (timeFrame == "week") {
                this.setDataTimeFlags(false, true, false, false);
            } else if (timeFrame == "month") {
                this.setDataTimeFlags(false, false, true, false);
            }

            //uncheck all previously selected checked boxes
            this.setDataSet(this.currentView);
            // uncheck all other checked boxes
            $("input:checkbox").on('click', function () {
                // in the handler, 'this' refers to the box clicked on
                var $box = $(this);
                if ($box.is(":checked")) {
                    // the name of the box is retrieved using the .attr() method
                    // as it is assumed and expected to be immutable
                    var group = "input:checkbox[name='" + $box.attr("name") + "']";
                    // the checked state of the group/box on the other hand will change
                    // and the current value is retrieved using .prop() method
                    $(group).prop("checked", false);
                    $box.prop("checked", true);
                } else {
                    $box.prop("checked", false);
                }
                $box.prop("disabled", true);
            });
        },

        sortData: function (sort, sortAscending, data) {
            //sorting should generally happen wherever the data is coming from
            sortedData = _.sortBy(data, function (item) {
                return item[sort];
            });

            if (sortAscending === false) {
                sortedData.reverse();
            }
            return {
                "currentPage": 0,
                "externalSortColumn": sort,
                "externalSortAscending": sortAscending,
                "pretendServerData": sortedData,
                "results": sortedData.slice(0, this.state.externalResultsPerPage)
            };
        },


        sort: function (sort, sortAscending) {
            this.setState(this.sortData(sort, sortAscending, this.state.data));
        },

        onRowClick: function (rowData, event) {
            var td = event.target;
            if (td.textContent == "Show Size") {
                var login = rowData.props.data.login;

                var urlData = window.location.href.replace("admin", "");
                urlData += "user/" + this.user + "/storage/" + login;

                td.textContent = "Fetching Data";
                var self = this;
                $.ajax({
                    url: urlData, success: function (result) {
                        var data = self.state.data;
                        if (self.storedData[self.currentView + "/" + self.timeFrame] != null) {
                            for (var key in data) {
                                var object = data[key];
                                if (object.login == login) {
                                    object.storage = result;
                                }
                            }
                        }
                        td.textContent = result;
                        self.setState({data: data});
                        alert("Storage size for user " + login + " is: " + result);
                    }
                });
            }
            if (td.textContent == "ERROR") {
                var login = rowData.props.data.login;
                var project = rowData.props.data.project;
                var experiment = rowData.props.data.experiment;
                var data = this.state.data;
                if (this.storedData[this.currentView + "/" + this.timeFrame] != null) {
                    for (var key in data) {
                        var object = data[key];
                        if (object.login == login && object.project == project && object.experiment == experiment) {
                            alert(object.error);
                            break;
                        }
                    }
                }
            }
        },

        render: function () {
            return (
                <div>
                    <div id="adminButtonHeader" className="adminButtonHeadverDiv">
                        <ButtonComponent id={"Users"} selectedState={this.usersViewSelected}
                                         onClick={this.changeViewData.bind(this, "Users")}/>
                        <ButtonComponent id={"Simulations"} selectedState={this.simulationsViewSelected}
                                         onClick={this.changeViewData.bind(this, "Simulations")}/>
                    </div>
                    <div id="timeFrameButtonHeader" className="timeFrameButtonHeadverDiv">
                        <label>
                            <input type="checkbox" className="radio" name="checkbox" value="1"
                                   disabled={this.lastDaySelected ? "disabled" : "" }
                                   checked={this.lastDaySelected ? "checked" : "" }
                                   onClick={this.changeTimeData.bind(this, "day")}/>Day</label>
                        <label>
                            <input type="checkbox" className="radio" name="checkbox" value="1"
                                   disabled={this.lastWeekSelected ? "disabled" : "" }
                                   checked={this.lastWeekSelected ? "checked" : "" }
                                   onClick={this.changeTimeData.bind(this, "week")}/>Week</label>
                        <label>
                            <input type="checkbox" className="radio" name="checkbox" value="1"
                                   disabled={this.lastMonthSelected ? "disabled" : "" }
                                   checked={this.lastMonthSelected ? "checked" : "" }
                                   onClick={this.changeTimeData.bind(this, "month")}/>Month</label>
                        <label>
                            <input type="checkbox" className="radio" name="checkbox" value="1"
                                   checked={this.allTimeSelected ? "checked" : "" }
                                   disabled={this.allTimeSelected ? "disabled" : "" }
                                   onClick={this.changeTimeData.bind(this, "all")}/>All Time</label>

                    </div>
                    {this.state.loaded ?
                        <Griddle results={this.state.data} columnMetadata={this.state.columnMeta}
                                 bodyHeight={this.props.height}
                                 enableInfinteScroll={true} useGriddleStyles={false}
                                 resultsPerPage={this.resultsPerPage} showPager={false}
                                 showFilter={true} onRowClick={this.onRowClick} initialSort={"lastLogin"}
                                 initialSortAscending={false}
                                 columns={this.state.columns}/>
                        :
                        <div id="loading-container">
                            <div className="gpt-gpt_logo fa-spin"></div>
                            <p className="orange loadingText">Fetching data (might take a few seconds depending on your
                                network)</p>
                        </div>
                    }
                </div>
            );

        }
    });

    return adminPanelComponent;
});
