$(function () {
    $.widget("custom.datagrid",
        {
            options: {
                columns: [],
                rows: [],
                resizable: true,
            },

            _create: function () {

                this.table = this.element;


                this._build();
            },

            _build: function () {
                var self = this;

                this._buildTableHead();
                this._buildTableBody();
            },

            _buildTableHead: function () {
                var self = this;

                this.tableHead = $("<thead>")
                    .addClass("thead-light")
                    .appendTo(this.table);

                this.tableHeadRow = $("<tr>")
                    .appendTo(this.tableHead);

                this.options.columns.forEach((column, index, columns) => {

                    var $th = $("<th>")
                        .appendTo(self.tableHeadRow);

                    var $thWrapper = $("<div>")
                        .addClass("w-100 m-0 p-0 d-flex justify-content-between")
                        .append($("<span>")
                            .text(column.header))
                        .appendTo($th);

                    var $thActions = $("<div>")
                        .appendTo($thWrapper);

                    if (column.width) {
                        $th.css("width", column.width);
                        column.minWidth = column.width;
                    }

                    if (!column.minWidth)
                        column.minWidth = 80;

                    // //TODO: split into search, filter and more?
                    // if(column.allowFilter) {
                    //     var sortButton = $("<i>")
                    //         .addClass("fas fa-filter datagrid-header-icon")
                    //         .appendTo($thActions);
                    // }

                    if (column.allowSearch || column.allowFilter) {
                        if (!self.filterRow) {
                            self.filterRow = $("<tr>")
                                .addClass("filter-row")
                                .insertAfter(self.tableHeadRow);

                            self.options.columns.forEach(column => {
                                $("<td>")
                                    .append($("<div>").addClass("h-100 d-flex justify-content-between align-items-center filter-cell"))
                                    .appendTo(self.filterRow);
                            });
                        }
                    }

                    if (column.allowSearch) {
                        var $filterCell = self.filterRow.find("td div.filter-cell").get(index);
                        $("<input>")
                            .addClass("form-control")
                            .attr("type", "search")
                            .attr("placeholder", "Search...")
                            .appendTo($filterCell)
                            .on("input", function () {
                                self._searchColumn(column.header, $(this).val());
                            });
                    }

                    if (column.allowFilter) {
                        var $filterCell = self.filterRow.find("td div.filter-cell").get(index);
                        $("<i>")
                            .addClass("fas fa-filter ml-2")
                            .appendTo($filterCell);
                    }

                    if (column.allowSort) {
                        $("<i>")
                            .addClass("fas fa-sort datagrid-sort datagrid-header-icon ml-1")
                            .appendTo($thActions);

                        $th
                            .addClass("sortable")
                            .click(function () {
                                var $sortIcon = $(this).find(".datagrid-sort");
                                var currentSortDirection = $(this).data("sortDirection");

                                $("th.sortable").data("sortDirection", "");
                                self._setSortIcon($(".datagrid-sort"));

                                var newSortDirection = (!currentSortDirection || currentSortDirection === "DESC") ? "ASC" : "DESC";

                                $(this).data("sortDirection", newSortDirection);
                                self._setSortIcon($sortIcon, newSortDirection);
                                self._sortColumn(column.header, newSortDirection);
                            });
                    }

                    column.calculated = {};

                    if (self.options.resizable && column.resizable !== false) {
                        if (columns.length - 1 != index) {
                            $th.resizable({
                                handles: "e",
                                minWidth: column.minWidth,
                                resize: function (event, ui) {
                                    if (!column.calculated.width) column.calculated.width = ui.originalSize.width;

                                    var widthDifference = ui.size.width - column.calculated.width;

                                    var newNeighbourWidth = $(this).next().width() - widthDifference
                                    if (widthDifference && (newNeighbourWidth >= columns[index + 1].minWidth)) {
                                        $(this).next().width(columns[index + 1].calculated.width = $(this).next().width() - widthDifference);
                                    } else {
                                        $(this).width(column.calculated.width);
                                    }

                                    column.calculated.width = ui.size.width;
                                },
                                stop: function (event, ui) {
                                    column.calculated.width = $th.width();
                                    columns[index + 1].calculated.width = $th.next().width();
                                }
                            });
                        }
                    }
                });
            },

            _buildTableBody: function () {
                var self = this;

                this.tableBody = $("<tbody>")
                    .appendTo(this.table);

                this.options.rows.forEach((row) => {

                    console.log(row.cells);
                    if(row.cells.some(cell => {return cell.hidden})) return;

                    row.element = $("<tr>")
                        .appendTo(self.tableBody);

                    row.cells.forEach((cell) => {
                        cell.element = $("<td>")
                            .text(cell.text)
                            .appendTo(row.element);
                    });
                });
            },

            _rebuildTableBody: function () {
                this.tableBody.remove();
                this._buildTableBody();
            },

            _setSortIcon($selector, direction) {
                $selector
                    .removeClass("fa-sort")
                    .removeClass("fa-sort-up")
                    .removeClass("fa-sort-down");

                if (direction === "ASC")
                    $selector.addClass("fa-sort-up");
                else if (direction === "DESC")
                    $selector.addClass("fa-sort-down");
                else $selector.addClass("fa-sort");
            },

            _sortColumn(columnHeader, direction) {
                var columnIndex = this.options.columns.findIndex(col => col.header === columnHeader);
                var column = this.options.columns[columnIndex];
                if (!column || !column.allowSort) return;

                var sortDesc = direction === "DESC";

                this.options.rows.sort((a, b) => {
                    var aText = a.cells[columnIndex].text.toLowerCase();
                    var bText = b.cells[columnIndex].text.toLowerCase();

                    if (aText < bText) return sortDesc ? 1 : -1;
                    if (aText > bText) return sortDesc ? -1 : 1;
                    return 0;
                });

                this._rebuildTableBody();
            },

            _searchColumn(columnHeader, searchTerm) {
                var searchTerm = searchTerm.toLowerCase();
                var columnIndex = this.options.columns.findIndex(col => col.header === columnHeader);
                var column = this.options.columns[columnIndex];
                if (!column || !column.allowSearch) return; 

                this.options.rows.forEach(row => {
                    var cell = row.cells[columnIndex];
                    var text = cell.text.toLowerCase();

                    cell.hidden = (text && !text.includes(searchTerm));
                });

                this._rebuildTableBody();
            },

            _destroy: function () {
            }
        });
});