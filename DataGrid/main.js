$(function () {
    $.widget("custom.datagrid",
        {
            options: {
                columns: [],
                rows: [],
                allowResize: false,
                allowColumnReorder: false,
                allowColumnHiding: false,
                allowSaveState: false,
                enablePagination: false,
                scrollToItem: false,
                stickyHeader: false,
                dataSource: null,
                finalize: null,

                pageSizes: [10, 25, 50, -1],

                actions: [],

                onRowClick: null,
                onRowDoubleClick: null,
            },

            _create: function () {
                var self = this;

                this.table = this.element;
                this.id = toCamelCase(this.element.attr("id"));

                this._extractTableData();
                this._loadDataSource(function () {
                    self._build();
                    self._loadTableState();

                    if(self.options.finalize) {
                        self.options.finalize();
                    }
                });
            },

            _extractTableData: function () {
                var self = this;

                self.options.allowResize = self.options.allowResize || self.table.is("[data-allow-resize]");
                self.options.allowColumnReorder = self.options.allowColumnReorder || self.table.is("[data-allow-column-reorder]");
                self.options.allowColumnHiding = self.options.allowColumnHiding || self.table.is("[data-allow-column-hiding]");
                self.options.allowSaveState = self.options.allowSaveState || self.table.is("[data-allow-save-state]");
                self.options.enablePagination = self.options.enablePagination || self.table.is("[data-enable-pagination]");
                self.options.scrollToItem = self.options.scrollToItem || self.table.is("[data-scroll-to-item]");
                self.options.stickyHeader = self.options.stickyHeader || self.table.is("[data-sticky-header]");

                var tableHeadRow = this.table.find("thead tr:first");
                if (tableHeadRow.length) {
                    tableHeadRow.find("th").each(function () {

                        var column = {
                            header: $(this).text(),
                            allowSort: $(this).is("[data-allow-sort]"),
                            allowFilter: $(this).is("[data-allow-filter]"),
                            allowSearch: $(this).is("[data-allow-search]"),
                        }

                        if ($(this).is("[data-width]"))
                            column.width = parseInt($(this).data("width"));

                        if ($(this).is("[data-max-filter-Count]"))
                            column.maxFilterCount = parseInt($(this).data("maxFilterCount"));

                        self.options.columns.push(column);
                    });
                }

                var tableBody = this.table.find("tbody");
                if (tableBody.length) {
                    tableBody.find("tr").each(function () {
                        var row = {
                            cells: []
                        };

                        $(this).find("td").each(function () {
                            row.cells.push({ text: $(this).text() });
                        });

                        self.options.rows.push(row);
                    });
                }

                this.table.empty();
            },

            _build: function () {
                var self = this;

                this.urlParameters = new URLSearchParams(window.location.search);

                this._buildTableHead();
                this._buildPagination();
                this._buildTableBody();

                if (this.options.enablePagination) {

                    var urlIndex = this.urlParameters.get(`${this.id}Index`);
                    if (this.id && urlIndex) {
                        this.pagination.currentPage = Math.floor(urlIndex / this.pagination.pageSize);
                    }

                    this._switchPage(this.pagination.currentPage);

                    if (urlIndex) {
                        var rowIndex = urlIndex % this.pagination.pageSize;

                        var $row = this.tableBody.find(`tr:nth-child(${rowIndex + 1})`);

                        if (this.options.scrollToItem)
                            this._scrollToItem(rowIndex);

                        $row.animate({
                            backgroundColor: "#ccc"
                        }, 500, function () {
                            var $this = $(this);
                            setTimeout(function () {
                                $this.animate({
                                    backgroundColor: ""
                                }, 500, function () {
                                    $this.css("background-color", "");
                                });
                            }, 1000)
                        })
                    }
                }

                //TODO: remove
                window.cols = this.options.columns;
                window.rows = this.options.rows;
                window.columnFilters = this.columnFilters;
            },

            _buildTableHead: function () {
                var self = this;

                this.hiddenColumns = [];

                this.tableHead = $("<thead>")
                    .addClass("thead-light")
                    .appendTo(this.table);

                this.tableHeadRow = $("<tr>")
                    .appendTo(this.tableHead);

                if (this.options.columns.some(col => col.allowFilter))
                    this._getColumnFilters();

                this.options.columns.forEach((column, index, columns) => {

                    var $th = $("<th>")
                        .attr("data-header", column.header)
                        .appendTo(self.tableHeadRow);

                    column.th = $th;
                    column.isVisible = true;
                    column.index = index;

                    var $thWrapper = $("<div>")
                        .addClass("w-100 m-0 p-0 d-flex justify-content-between")
                        .append($("<span>")
                            .text(column.header))
                        .appendTo($th);

                    if (self.options.allowColumnReorder) {
                        $("<span>")
                            .addClass("grip-icons mr-3")
                            .append($("<i>")
                                .addClass("fas fa-grip-vertical"))
                            .prependTo($thWrapper);
                    }

                    var $thActions = $("<div>")
                        .appendTo($thWrapper);

                    if (column.width) {
                        $th.css("width", column.width);
                        column.minWidth = parseInt(column.width);
                    }

                    if (!column.minWidth)
                        column.minWidth = 80;

                    if (column.allowSearch || column.allowFilter) {
                        if (!self.filterRow) {
                            self.filterRow = $("<tr>")
                                .addClass("filter-row")
                                .insertAfter(self.tableHeadRow);

                            self.options.columns.forEach((column) => {
                                column.filterCell = $("<td>")
                                    .append($("<div>").addClass("h-100 d-flex justify-content-between align-items-center filter-cell"))
                                    .appendTo(self.filterRow);
                            });
                        }
                    }

                    if (column.allowSearch) {
                        var $filterCell = self.filterRow.find("td div.filter-cell").get(index);
                        $("<input>")
                            .addClass("form-control h-auto datagrid-search-input")
                            .attr("type", "text")
                            .attr("placeholder", "Search...")
                            .appendTo($filterCell)
                            .dblclick(function () {
                                $(this).val("");
                                $(this).trigger("input");
                            })
                            .on("input", function () {
                                self._searchColumn(column.header, $(this).val());
                            });
                    }

                    if (column.allowFilter) {
                        var $filterCell = self.filterRow.find("td div.filter-cell").get(index);

                        var filterIconClasses = "fas fa-filter";
                        if (column.allowSearch)
                            filterIconClasses += " ml-2";

                        var $filterDropdown = $("<div>")
                            .addClass("dropdown")
                            .appendTo($filterCell);

                        var $filterButton = $("<span>")
                            .addClass("action-icon m-auto")
                            .attr("data-toggle", "dropdown")
                            .append($("<i>")
                                .addClass(filterIconClasses))
                            .appendTo($filterDropdown);

                        var $filterItems = $("<div>")
                            .addClass("dropdown-menu dropdown-menu-right")
                            .appendTo($filterDropdown);

                        this.columnFilters[column.header].forEach((filter, index) => {
                            if (column.maxFilterCount > 0 && index >= column.maxFilterCount) return;

                            filter.switch = self._buildFilterSwitch(filter)
                                .appendTo($filterItems);
                        });

                        $("<div>")
                            .addClass("dropdown-divider")
                            .appendTo($filterItems);

                        var $resetButton = $("<button>")
                            .addClass("dropdown-item d-flex justify-content-between align-items-center")
                            .text("Reset filters")
                            .prepend($("<i>").addClass("fas fa-times"))
                            .click(function (e) {
                                e.stopPropagation();
                                e.preventDefault();

                                self.columnFilters[column.header].forEach(filter => {
                                    filter.isActive = false;
                                    filter.switch.find(".custom-control-input").prop("checked", false);
                                    self._filterColumn(column.header);
                                    $filterButton.removeClass("action-icon-active");
                                });
                            })
                            .appendTo($filterItems);
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

                    if (this.options.allowColumnReorder) {
                        this.table.sorttable({
                            placeholder: 'placeholder',
                            helperCells: null,
                            tolerance: "pointer",
                            axis: "x",
                        }, {
                            update: function () {
                                self.tableHeadRow.find("th").each(function (index) {
                                    var column = self._getColumnByHeader($(this).data("header"));
                                    column.index = index;
                                });

                                self._setColumnResize();
                            },
                        }).disableSelection();
                    }
                });

                var actionLength = this.options.actions.length;

                if (actionLength) {

                    var column = { header: "_actions", isVisible: true };
                    column.th = $("<th>")
                        .attr("data-header", column.header)
                        .addClass("datagrid-action-header text-right")
                        .appendTo(this.tableHeadRow);

                    column.index = self.options.columns.length;
                    column.calculated = {}

                    if (actionLength === 1) {
                        column.th.addClass("datagrid-action-one-button");
                    } else if (actionLength === 2) {
                        column.th.addClass("datagrid-action-two-buttons");
                    } else {
                        column.th.addClass("datagrid-action-many-buttons");
                    }

                    column.minWidth = parseInt(column.th.css("min-width"));

                    if (this.options.allowColumnReorder) {
                        $("<span>")
                            .addClass("grip-icons mr-3")
                            .append($("<i>")
                                .addClass("fas fa-grip-vertical"))
                            .prependTo(column.th);
                    }

                    if (this.filterRow)
                        column.filterCell = $("<td>")
                            .addClass("datagrid-action-header")
                            .appendTo(this.filterRow);

                    this.options.columns.push(column);
                }

                if (this.options.stickyHeader) {
                    this.tableHead.find("td, th")
                        .addClass("datagrid-header-sticky");

                    this.tableHead.find("td").css("top", this.tableHeadRow.height());
                }

                self._setHeaderContextMenu();
                self._setColumnResize();
            },

            _buildTableBody: function () {
                var self = this;

                this.tableBody = $("<tbody>")
                    .appendTo(this.table);

                var rows = this.options.rows.filter(row => !row.cells.some(cell => cell.hidden));

                if (this.options.enablePagination) {
                    rows = rows.slice(this.pagination.currentIndex, this.pagination.currentIndex + this.pagination.visibleItems);
                }

                rows.forEach((row) => {

                    if (row.cells.some(cell => { return cell.hidden })) return;

                    row.element = $("<tr>")
                        .appendTo(self.tableBody);

                    if (self.options.onRowClick) {
                        row.element
                            .addClass("datagrid-clickable-row")
                            .click(self.options.onRowClick);
                    }

                    if (self.options.onRowDoubleClick) {
                        row.element
                            .addClass("datagrid-clickable-row")
                            .dblclick(self.options.onRowDoubleClick);
                    }

                    var cellOrder = self.options.columns.map(col => col.th.index());

                    for (var cellIndex = 0; cellIndex < cellOrder.length; cellIndex++) {
                        var columnIndex = cellOrder.indexOf(cellIndex);

                        if (columnIndex === -1) continue;
                        if (self.options.columns[columnIndex].header === "_actions") continue;
                        if (!self.options.columns[columnIndex].isVisible) continue;

                        var cell = row.cells[columnIndex];
                        if (cell) {
                            cell.element = $("<td>")
                                .text(cell ? cell.text : "")
                                .appendTo(row.element);
                        }
                    }

                    if (this.options.actions.length) {
                        self._buildActions(row);
                    }
                });

                if (!this.tableBody.find("tr").length) {
                    $("<tr>")
                        .append($("<td>")
                            .append($("<div>")
                                .addClass("d-flex justify-content-center align-items-center")
                                .append($("<i>").addClass("fas fa-info-circle mr-2"))
                                .append($("<span>").text("No rows found to display")))
                            .attr("colspan", this.options.columns.length))
                        .appendTo(this.tableBody);
                }
            },

            _buildActions: function (row) {
                var self = this;

                var $actionCell = $("<td>")
                    .addClass("datagrid-action-cell");

                var actionsColumnIndex = this._getColumnByHeader("_actions").th.index("th:visible");
                if (actionsColumnIndex === 0)
                    row.element.prepend($actionCell);
                else row.element.find(`td:nth-child(${actionsColumnIndex})`).after($actionCell)

                self._setRowContextMenu(row);

                this.options.actions.forEach(action => {

                    if(row.actions)
                        var rowAction = row.actions.find(rowAction => rowAction.name == action.name);

                    $actionButton = $("<button>")
                        .addClass("btn btn-primary")
                        .prop("disabled", action.disabled || (rowAction && rowAction.disabled))
                        .append($("<i>")
                            .addClass(`fas fa-${action.icon}`))
                        .appendTo($actionCell);

                    if (action.action) {
                        $actionButton.click(function () {
                            var arguments = [];
                            if (rowAction && rowAction.arguments)
                                arguments = [...rowAction.arguments];

                            action.action(...arguments);
                        });
                    }

                    if (action.dataAttributes) {
                        Object.keys(action.dataAttributes).forEach(attribute => {
                            $actionButton.attr(`data-${toKebabCase(attribute)}`, action.dataAttributes[attribute]);
                        });
                    }

                    if (rowAction && rowAction.dataAttributes) {
                        Object.keys(rowAction.dataAttributes).forEach(attribute => {
                            $actionButton.attr(`data-${toKebabCase(attribute)}`, rowAction.dataAttributes[attribute]);
                        });
                    }

                    if (action.tooltip) {
                        $actionButton
                            .attr("data-toggle", "tooltip")
                            .attr("title", action.tooltip);
                    }
                });
            },

            _buildPagination: function () {
                var self = this;

                if (this.options.enablePagination) {

                    var defaultPageSize = self.options.pageSizes[0];

                    this.pagination = {
                        pageSize: defaultPageSize,
                        currentPage: 0,
                        totalPages: Math.ceil(self.options.rows.length / defaultPageSize)
                    };

                    this.tableWrapper = $("<div>")
                        .addClass("datagrid-wrapper")
                        .insertAfter(this.table)
                        .append(this.table);

                    this.paginationWrapper = $("<div>")
                        .addClass("datagrid-pagination-wrapper w-100 d-flex justify-content-between align-items-center")
                        .appendTo(this.tableWrapper);

                    this.paginationSettings = $("<div>")
                        .addClass("d-flex align-items-center datagrid-pagination-settings")
                        .appendTo(this.paginationWrapper);

                    $("<span>")
                        .addClass("text-nowrap d-block mr-2")
                        .text("Rows per page: ")
                        .appendTo(this.paginationSettings);

                    var $pageSizeSelect = $("<select>")
                        .addClass("form-control badge h-auto")
                        .change(function () {
                            self.pagination.pageSize = parseInt($(this).val());
                            self.pagination.totalPages = Math.ceil(self.options.rows.length / self.pagination.pageSize);
                            self._switchPage(self.pagination.currentPage);
                        })
                        .appendTo(this.paginationSettings);

                    this.options.pageSizes.forEach(size => {
                        var text = size === -1 ? "All" : size;
                        var $option = $("<option>")
                            .val(size)
                            .text(text)
                            .appendTo($pageSizeSelect);

                        if (size == defaultPageSize)
                            $option.attr("selected", true);
                    });

                    this.paginationNavigation = $("<div>")
                        .addClass("d-flex align-items-center datagrid-pagination-navigation")
                        .appendTo(this.paginationWrapper);

                    this.paginationNavigationInfo = $("<span>")
                        .addClass("datagrid-pagination-navigation-info")
                        .text("10-20 of 100")
                        .appendTo(this.paginationNavigation);

                    $("<button>")
                        .addClass("btn btn-primary badge ml-2 datagrid-pagination-button-left")
                        .append($("<i>").addClass("fas fa-angle-double-left"))
                        .click(function () {
                            self._switchPage(0);
                        })
                        .appendTo(this.paginationNavigation);

                    $("<button>")
                        .addClass("btn btn-primary badge ml-1 datagrid-pagination-button-left")
                        .append($("<i>").addClass("fas fa-angle-left"))
                        .click(function () {
                            self._switchPage(self.pagination.currentPage - 1);
                        })
                        .appendTo(this.paginationNavigation);

                    $("<button>")
                        .addClass("btn btn-primary badge ml-1 datagrid-pagination-button-right")
                        .append($("<i>").addClass("fas fa-angle-right"))
                        .click(function () {
                            self._switchPage(self.pagination.currentPage + 1);
                        })
                        .appendTo(this.paginationNavigation);

                    $("<button>")
                        .addClass("btn btn-primary badge ml-1 datagrid-pagination-button-right")
                        .append($("<i>").addClass("fas fa-angle-double-right"))
                        .click(function () {
                            self._switchPage(self.pagination.totalPages - 1);
                        })
                        .appendTo(this.paginationNavigation);

                }
            },

            _buildFilterSwitch: function (filter) {
                var self = this;

                var itemWrapper = $("<li>")
                    .addClass("dropdown-item dropdown-item-switch");

                $("<span>")
                    .text(filter.value)
                    .appendTo(itemWrapper);

                var switchWrapper = $("<div>")
                    .addClass("custom-control custom-switch custom-switch-no-label")
                    .appendTo(itemWrapper);

                var switchInput = $("<input>")
                    .addClass("custom-control-input")
                    .attr("type", "checkbox")
                    .change(function () {
                        filter.isActive = $(this).prop("checked");
                        self._filterColumn(filter.column);

                        var $filterButton = filter.switch.parents(".dropdown").find(".action-icon");
                        if (self.columnFilters[filter.column].some(columnFilter => columnFilter.isActive))
                            $filterButton.addClass("action-icon-active");
                        else $filterButton.removeClass("action-icon-active");
                    })
                    .appendTo(switchWrapper);

                var switchLabel = $("<label>")
                    .addClass("custom-control-label")
                    .appendTo(switchWrapper);

                return itemWrapper;
            },

            _rebuildTableBody: function (updatePagination) {
                if (this.tableBody) {
                    this.tableBody.remove();

                    if (this.options.enablePagination && !updatePagination) {
                        this._switchPage(this.pagination.currentPage);
                    } else {
                        this._buildTableBody();
                    }
                }
            },

            _setHeaderContextMenu: function () {
                var self = this;

                var actions = [];

                if (this.options.allowColumnHiding) {

                    actions.push(
                        {
                            text: "Column Visibility",
                            actions: self.options.columns.filter(column => !column.header.startsWith("_")).map(column => {
                                return {
                                    text: column.header,
                                    type: "switch",
                                    isChecked: column.isVisible,
                                    onToggle: function (isChecked) {
                                        self._setColumnVisibility(column.header, isChecked);
                                    }
                                };
                            })

                        },
                    );
                }

                if (this.options.allowSaveState && this.id) {
                    actions.push({
                        text: "Save Table Settings",
                        action: function () {
                            self._saveTableState();
                        }
                    });

                    var savedTableState = localStorage.getItem(`${this.id}-state`);
                    if (savedTableState !== null) {
                        actions.push({
                            text: "Clear Table Settings",
                            action: function () {
                                localStorage.removeItem(`${self.id}-state`);
                                window.location.reload(); //TODO: replace with reload in ValiBridge.
                            }
                        })
                    }

                }

                if (actions.length) {

                    this.tableHeadRow.contextMenu({
                        actions: actions
                    });
                }

            },

            _setRowContextMenu: function (row) {
                var self = this;

                if (this.options.actions.length) {

                    row.element.contextMenu({
                        actions: this.options.actions.filter(action => {
                            if(!row.actions) return true;
                            var rowAction = row.actions.find(rowAction => rowAction.name === action.name);
                            if (rowAction && rowAction.disabled) return false;
                            return true;
                        }).map(action => {
                            if(row.actions)
                                var rowAction = row.actions.find(rowAction => rowAction.name === action.name);

                            var dataAttributes = {};

                            if (action.dataAttributes) {
                                dataAttributes = Object.assign(dataAttributes, action.dataAttributes);
                            }

                            if (rowAction && rowAction.dataAttributes) {
                                dataAttributes = Object.assign(dataAttributes, rowAction.dataAttributes);
                            }

                            return {
                                text: action.name,
                                dataAttributes: dataAttributes,
                                action: function () {
                                    if (!action.action) return;
                                    var arguments = [];
                                    if (action.arguments) arguments = arguments.concat(action.arguments);
                                    if (rowAction && rowAction.arguments) arguments = arguments.concat(rowAction.arguments);
                                    action.action(...arguments);
                                }
                            };
                        })
                    });
                }
            },

            _setColumnResize() {
                var self = this;
                var columns = this.options.columns;

                columns.forEach((column => {
                    if (column.th.hasClass("ui-resizable")) {
                        column.th.resizable("destroy");
                    }

                    var index = column.index;

                    if (self.options.allowResize && column.allowResize !== false) {
                        if (columns.length - 1 != index) {
                            column.th.resizable({
                                handles: "e",
                                minWidth: column.minWidth,
                                resize: function (event, ui) {
                                    if (!column.calculated.width) column.calculated.width = ui.originalSize.width;
                                    var widthDifference = ui.size.width - column.calculated.width;

                                    var $neighbour = $(this).nextAll("th:visible:first");
                                    var neighbourIndex = $neighbour.index();

                                    var newNeighbourWidth = $neighbour.outerWidth() - widthDifference;

                                    var neighbourColumn = columns.find(col => col.index === neighbourIndex);

                                    if (widthDifference && (newNeighbourWidth >= neighbourColumn.minWidth)) {
                                        $neighbour.width(neighbourColumn.calculated.width = $neighbour.width() - widthDifference);
                                        column.calculated.width = ui.size.width;
                                    } else {
                                        $(this).width(column.calculated.width);
                                    }
                                },
                                stop: function (event, ui) {
                                    var $neighbour = $(this).nextAll("th:visible:first");
                                    column.calculated.width = column.th.width();
                                    columns.find(col => col.index === $neighbour.index()).calculated.width = column.th.next().width();
                                }
                            });
                        }

                        column.th.css("z-index", 1000 - (10 * index));
                    }
                }));

                self.table.find(".ui-resizable-handle")
                    .click(function () {
                        return false;
                    })
                    .dblclick(function () {

                        var header = $(this).parents("th").data("header");
                        var column = self._getColumnByHeader(header);
                        var previousWidth = column.th.width();
                        column.th.width(column.minWidth);
                        column.th.next("th:visible").width(column.th.next().width() + previousWidth - column.minWidth);
                        return false;
                    });

            },

            _getColumnFilters() {
                var self = this;
                this.columnFilters = {};
                $.each(self.options.columns, function (index, col) {
                    var values = [...new Set(self.options.rows.map(row => row.cells[index].text))];
                    self.columnFilters[col.header] = values.map(value => {
                        return {
                            value: value,
                            isActive: false,
                            column: col.header
                        };
                    });
                });

                return this.columnFilters;
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

            _getColumnByHeader(columnHeader) {
                var columnIndex = this.options.columns.findIndex(col => col.header === columnHeader);
                if (columnIndex === -1) return;

                var column = this.options.columns[columnIndex];

                column.collectionIndex = columnIndex;
                return column;
            },

            _hideColumn(column) {
                var self = this;

                self.hiddenColumns.push({
                    header: column.header,
                    th: column.th,
                    filterCell: column.filterCell
                });

                setTimeout(function () {
                    column.th.detach();
                    if (column.filterCell)
                        column.filterCell.detach();

                    self._rebuildTableBody();
                }, 1);
            },

            _showColumn: function (column) {
                var self = this;

                var hiddenColumnIndex = self.hiddenColumns.findIndex(col => col.header === column.header);
                var hiddenColumn = self.hiddenColumns[hiddenColumnIndex];

                if (hiddenColumnIndex < 0) return;

                this.hiddenColumns.splice(hiddenColumnIndex, 1);

                setTimeout(function () {

                    var index = column.index;
                    if (index >= self.tableHeadRow.children().length) {
                        self.tableHeadRow.append(hiddenColumn.th);
                        if (hiddenColumn.filterCell)
                            self.filterRow.append(hiddenColumn.filterCell);
                    } else {
                        self.tableHeadRow.children().eq(index).before(hiddenColumn.th);
                        if (hiddenColumn.filterCell)
                            self.filterRow.children().eq(index).before(hiddenColumn.filterCell);
                    }

                    self._rebuildTableBody();
                }, 1);
            },

            _setColumnVisibility(columnHeader, isVisible) {
                var self = this;
                var column = this._getColumnByHeader(columnHeader);

                column.isVisible = isVisible;

                if (isVisible) {
                    self._showColumn(column);
                } else {
                    self._hideColumn(column);
                }

                $(".no-columns-visible").remove();
                if (this.paginationWrapper)
                    this.paginationWrapper.addClass("d-flex");

                if (!this.options.columns.filter(col => !col.header.startsWith("_")).some(col => col.isVisible)) {

                    this.options.columns.filter(col => col.header.startsWith("_")).forEach(col => {
                        self._hideColumn(col);
                    });

                    var $th = $("<th>")
                        .addClass("no-columns-visible text-center")
                        .text("No columns to show")
                        .appendTo(this.tableHeadRow);

                    if (this.paginationWrapper) this.paginationWrapper.removeClass("d-flex").hide();
                } else {
                    this.options.columns.filter(col => col.header.startsWith("_")).forEach(col => {
                        self._showColumn(col);
                    });
                }

                this._setHeaderContextMenu();
                this._rebuildTableBody();
            },

            _scrollToItem(rowIndex) {
                var $row = this.tableBody.find(`tr:nth-child(${rowIndex + 1})`);

                var scrollTop = $row.offset().top;

                if (this.options.stickyHeader)
                    scrollTop -= this.tableHead.height();

                if ($([document.documentElement, document.body]).scrollTop == scrollTop) return;

                $([document.documentElement, document.body]).animate({
                    scrollTop: scrollTop
                }, 500);
            },

            _switchPage(newPage) {
                var self = this;

                var totalRows = this.options.rows.filter(row => !row.cells.some(cell => cell.hidden)).length;
                var newIndex = this.pagination.pageSize == -1 ? 0 : newPage * this.pagination.pageSize;

                if (newIndex > totalRows) {
                    newIndex = Math.floor(totalRows / this.pagination.pageSize);
                }

                this.pagination.visibleItems = this.pagination.pageSize == -1 ? totalRows : this.pagination.pageSize;

                if (totalRows - newIndex <= this.pagination.visibleItems) {
                    this.paginationWrapper.find(".datagrid-pagination-button-right").prop("disabled", true);
                    this.pagination.visibleItems = totalRows - newIndex;
                } else {
                    this.paginationWrapper.find(".datagrid-pagination-button-right").prop("disabled", false);
                }

                this.paginationWrapper.find(".datagrid-pagination-button-left").prop("disabled", newIndex === 0);

                this.paginationNavigationInfo.text(`${newIndex + 1}-${newIndex + this.pagination.visibleItems} of ${totalRows}`)

                this.pagination.currentIndex = newIndex;
                this.pagination.currentPage = newPage;
                this._rebuildTableBody(true);
            },

            _sortColumn(columnHeader, direction) {
                var column = this._getColumnByHeader(columnHeader);
                if (!column || !column.allowSort) return;

                var sortDesc = direction === "DESC";

                this.options.rows.sort((a, b) => {

                    var aContent = a.cells[column.collectionIndex].text;
                    var bContent = b.cells[column.collectionIndex].text;

                    if (typeof aContent === "string") aContent = aContent.toLowerCase();
                    if (typeof bContent === "string") bContent = bContent.toLowerCase();

                    if (aContent < bContent) return sortDesc ? 1 : -1;
                    if (aContent > bContent) return sortDesc ? -1 : 1;
                    return 0;
                });

                this._rebuildTableBody();
            },

            _searchColumn(columnHeader, searchTerm) {
                var column = this._getColumnByHeader(columnHeader);
                if (!column || !column.allowSearch) return;

                this.options.rows.forEach(row => {
                    var cell = row.cells[column.collectionIndex];
                    cell.hidden = (cell.text.toString() && !queryText(cell.text.toString(), searchTerm));
                });

                this._rebuildTableBody();
                this._scrollToItem(0);
            },

            _filterColumn(columnHeader) {
                var column = this._getColumnByHeader(columnHeader);
                if (!column) return;

                var filters = this.columnFilters[columnHeader].filter(filter => filter.isActive).map(filter => filter.value);

                this.options.rows.forEach(row => {
                    var cell = row.cells[column.collectionIndex];
                    cell.hidden = filters.length && !filters.includes(cell.text);
                });

                this._rebuildTableBody();
            },

            _saveTableState() {
                var self = this;

                var columnStates = this.options.columns.map(column => {

                    if (column.allowFilter) {
                        var columnFilter = self.columnFilters[column.header];

                        if (columnFilter)
                            var activeFilters = self.columnFilters[column.header].filter(columnFilter => columnFilter.isActive);
                    }

                    return {
                        header: column.header,
                        index: column.index,
                        width: column.th.width(),
                        isVisible: column.isVisible,
                        searchTerm: column.filterCell.find(".datagrid-search-input").val(),
                        sortDirection: column.th.data("sortDirection"),
                        activeFilters: activeFilters,
                    };
                });

                var tableState = {
                    columns: columnStates,
                    pageSize: self.pagination.pageSize,
                }

                localStorage.setItem(`${this.id}-state`, JSON.stringify(tableState));
            },

            _loadTableState() {
                var self = this;
                var jsonState = localStorage.getItem(`${this.id}-state`);
                if (!jsonState) return;

                var state = JSON.parse(jsonState);
                if (!state) return;

                this.options.columns.forEach((column, index) => {
                    var savedColumnState = state.columns.find(col => col.header === column.header);

                    self._setColumnVisibility(column.header, savedColumnState.isVisible);

                    column.th.width(savedColumnState.width);

                    if (column.allowSearch) {
                        column.filterCell.find(".datagrid-search-input").val(savedColumnState.searchTerm);

                        self._searchColumn(column.header, savedColumnState.searchTerm);
                    }

                    if (column.allowFilter && self.columnFilters[column.header] && savedColumnState && savedColumnState.activeFilters.length > 0) {
                        savedColumnState.activeFilters.forEach((activeFilter, index) => {
                            var columnFilter = self.columnFilters[column.header].find(columnFilter => columnFilter.value === activeFilter.value);

                            columnFilter.isActive = true;
                            columnFilter.switch.find(".custom-control-input").prop("checked", true);

                            if (index === savedColumnState.activeFilters.length - 1)
                                self._filterColumn(column.header);
                        });
                    }

                    if (savedColumnState.sortDirection) {
                        column.th.data("sortDirection", savedColumnState.sortDirection);
                        self._sortColumn(column.header, savedColumnState.sortDirection);
                        self._setSortIcon(column.th.find(".datagrid-sort"), savedColumnState.sortDirection);
                    }

                    column.index = savedColumnState.index;

                    if (index === self.options.columns.length - 1) {

                        var sortedColumns = [...this.options.columns];

                        sortedColumns.sort((a, b) => {
                            return (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0);
                        }).forEach(((column, index) => {
                            column.th.appendTo(self.tableHeadRow);
                            if (self.filterRow)
                                column.filterCell.appendTo(self.filterRow);

                            if (index === self.options.columns.length - 1) {
                                self._rebuildTableBody();
                                self._setColumnResize();
                            }
                        }));
                    }
                });
            },

            _loadDataSource: function (callback) {
                if (!this.options.dataSource) {
                    callback();
                    return;
                }

                var self = this;

                $.get(self.options.dataSource, function (data) {
                    data.forEach((obj, index) => {

                        var columns = [];

                        var objectKeys = Object.keys(obj);
                        objectKeys.forEach((key, keyIndex) => {

                            column = self._getColumnByHeader(key);
                            if (column) columns.push({ columnIndex: column.columnIndex, text: obj[key] });

                            if (keyIndex === objectKeys.length - 1) {

                                columns.sort((a, b) => {
                                    return (a.columnIndex > b.columnIndex) ? 1 : ((b.columnIndex > a.columnIndex) ? -1 : 0);
                                }).map(column => { return { text: column.text }; });

                                var row = { cells: columns };
                                self.options.rows.push(row);

                                if (index === data.length - 1) {
                                    callback();
                                }
                            }
                        });
                    })
                });
            },

            _destroy: function () {
            }
        });
});