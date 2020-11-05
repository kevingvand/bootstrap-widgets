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
                        .text(column.header)
                        .appendTo(self.tableHeadRow);

                    if (column.width)
                        $th.css("width", column.width);

                    if (!column.minWidth)
                        column.minWidth = 10;

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

                    var $row = $("<tr>")
                        .appendTo(self.tableBody);

                    row.cells.forEach((cell) => {
                        $("<td>")
                            .text(cell.text)
                            .appendTo($row);
                    });
                });
            },

            _destroy: function () {
            }
        });
});