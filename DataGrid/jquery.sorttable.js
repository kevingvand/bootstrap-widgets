﻿(function ($) {
    $.widget("extend.sorttable", $.ui.sortable, {
        widgetEventPrefix: "sorttable",
        options: {
            helper: "table",
            helperCells: 1
        },
        _table: null,
        _startIndex: 0,
        _endIndex: 0,
        _currentItemWidth: 0,
        _sortCells: null,
        _createHelper: function (event) {
            var o = this.options;

            if (o.helper == 'table') {
                // if using 'table' helper
                if (!this.setWidths) {
                    this.setWidths = true;
                    var items = this.items;
                    var widths = [];
                    for (i = 0; i < items.length; i++) {
                        var item = $(items[i].item[0]);
                        widths[i] = item.innerWidth() - parseInt(item.css('paddingLeft') || 0, 10) - parseInt(item.css('paddingRight') || 0, 10);
                    }
                    for (i = 0; i < items.length; i++) {
                        var item = $(items[i].item[0]);
                        item.width(widths[i]);
                    }
                }

                return this._createHelperTable(event, this.currentItem);
            }
            else {
                // use default helper method
                return $.ui.sortable.prototype._createHelper.apply(this, [event]);
            }
        },
        _createHelperTable: function (e, ui) {
            var o = this.options, helperCells = o.helperCells;
            var hc = ui.is('th') || ui.is('td') ? ui : ui.parents('th:first,td:first');
            var index = hc.prevAll().length + 1
            var hcWidth = hc.innerWidth() - parseInt(hc.css('paddingLeft') || 0, 10) - parseInt(hc.css('paddingRight') || 0, 10);
            this._currentItemWidth = hcWidth;
            var table = this._table;

            var helperCellCount;
            if (typeof helperCells == 'number') {
                helperCellCount = helperCells;
            }

            var cells = $([]);
            if (helperCellCount != 1) {
                cells = table.children().find('>tr:not(.ui-sortable)>td:nth-child(' + index + ')');
                if (helperCellCount < 0) {
                    cells = cells.slice(0, cells.length + helperCellCount);
                }
                else if (helperCellCount > 1) {
                    cells = cells.slice(0, helperCellCount - 1);
                }
            }

            if (!helperCellCount && helperCells) {
                cells = cells.filter(helperCells);
            }

            cells.splice(0, 0, hc); // insert first cell

            headerCellCount = table.find("thead").children().length;

            this._sortCells = cells;

            var tableClone = table.clone().empty();
            tableClone.addClass("table-drag-helper");
            tableClone.css('position', 'absolute');
            tableClone.css('width', 'auto');
            tableClone.css('min-width', 'inherit');
            tableClone.css('height', 'auto');
            tableClone.css('min-height', 'inherit');
            tableClone.attr('id', '');

            var headerClone = table.find("thead").clone().empty();
            headerClone.appendTo(tableClone);

            for (i = 0; i < cells.length; i++) {
                var cell = cells[i];
                if (!(cell instanceof jQuery)) {
                    cell = $(cell);
                }
                var tr = cell.parents('tr:first');
                var cellClone = cell.clone();
                cellClone.width(hcWidth);
                var trClone = tr.clone().empty();
                var trHeight = tr.innerHeight() - parseInt(tr.css('paddingTop') || 0, 10) - parseInt(tr.css('paddingBottom') || 0, 10);
                trClone.height(trHeight);
                cellClone.appendTo(trClone.appendTo(i < headerCellCount ? headerClone : tableClone));
            }

            tableClone.find().each(function () {
                this.attr('id', ''); // clear ids on cloned table
            });
            table.before(tableClone);

            return tableClone;
        },
        _createPlaceholder: function (that) {
            var self = that || this, o = self.options;

            // call base method
            $.ui.sortable.prototype._createPlaceholder.apply(this, arguments);


            if (o.helper == 'table') {
                var p = self.placeholder;
                // force width as border will prevent width from setting even though cell has no explicit width
                self.placeholder.width(self._currentItemWidth);

                self._createPlaceholderHelper();

                self._sortCells.hide();
            }
        },
        _createPlaceholderHelper: function () {
            var self = this;

            if (!self.placeholder) return;

            var columnIndex = self.placeholder.index();

            var $table = self._table;

            var headerRowCount = $table.find("thead").children().length;
            self.placeholder.attr('rowSpan', headerRowCount);

            $table.find("tbody").each(function () {
                var $columns = $(this).children().first().find(`td:not(placeholder)`);
                var $nextColumn = $columns.eq(columnIndex);

                var $customPlaceholder = $("<td>")
                    .addClass("ui-sortable-placeholder placeholder custom-placeholder")
                    .attr("rowSpan", $(this).children().length)

                if (!$nextColumn.length) {
                    $customPlaceholder.insertAfter($columns.last());
                } else $customPlaceholder.insertBefore($nextColumn);

            });
        },
        _swapNodes: function (a, b) {
            if (a && b) {
                var aparent = a.parentNode;
                var asibling = a.nextSibling === b ? a : a.nextSibling;
                b.parentNode.insertBefore(a, b);
                aparent.insertBefore(b, asibling);
            }
        },
        // bubble the moved col left or right
        _bubbleCols: function () {
            var from = this._startIndex;
            var to = this._endIndex;
            /* Find children thead and tbody.
            * Only to process the immediate tr-children. Bugfix for inner tables
            */
            var trs = this._table.children().find('> tr:not(.ui-sortable)');
            if (from < to) {
                for (var i = from; i < to; i++) {
                    var row1 = trs.find('>td:nth-child(' + i + '),>th:nth-child(' + i + ')');
                    var row2 = trs.find('>td:nth-child(' + (i + 1) + '),>th:nth-child(' + (i + 1) + ')')
                    for (var j = 0; j < row1.length; j++) {
                        this._swapNodes(row1[j], row2[j]);
                    }
                }
            }
            else {
                for (var i = from; i > to; i--) {
                    var row1 = trs.find('>td:nth-child(' + i + '),>th:nth-child(' + i + ')');
                    var row2 = trs.find('>td:nth-child(' + (i - 1) + '),>th:nth-child(' + (i - 1) + ')')
                    for (var j = 0; j < row1.length; j++) {
                        this._swapNodes(row1[j], row2[j]);
                    }
                }
            }
        },
        _rearrangeTableBackroundProcessing: function () {
            var _this = this;
            return function () {
                _this._bubbleCols();
            };
        },
        _sortChange: function () {
            var self = this;
            return function (e, ui) {
                self._table.find(".custom-placeholder").remove();
                self._createPlaceholderHelper();
            }
        },
        _sortStart: function () {
            var _this = this;
            return function (e, ui) {
                _this._startIndex = ui.item.prevAll().length + 1;
            }
        },
        _sortUpdate: function () {
            var _this = this;
            return function (e, ui) {
                _this._endIndex = ui.item.prevAll().length + 1;
                if (_this._startIndex != _this._endIndex) {
                    // do reorganisation asynchronous
                    // for chrome a little bit more than 1 ms because we want to force a rerender
                    setTimeout(_this._rearrangeTableBackroundProcessing(), 50);
                }
            }
        },
        _sortStop: function () {
            var self = this;
            return function (e, ui) {
                self._table.find(".custom-placeholder").remove();
                if (self._sortCells) {
                    self._sortCells.show();
                }
            }
        },
        _create: function () {
            var self = this;
            var el = this.element;
            if (el.is('table')) {
                this._table = el;
                // reset element to first tr
                el = this.element = el.find('tr:first');
            }
            else {
                // find parent table
                this._table = el.parents('table:first');
            }

            this._startIndex = 0;
            this._endIndex = 0;

            // bind to start and update
            el.bind("sorttablechange", this._sortChange());
            el.bind('sorttablestart', this._sortStart());
            el.bind('sorttableupdate', this._sortUpdate());
            el.bind('sorttablestop', this._sortStop());

            $.ui.sortable.prototype._create.apply(this);
        },
        destroy: function () {
            $.Widget.prototype.destroy.apply(this, arguments); // default destroy
            // now do other stuff particular to this widget
        }
    });
})(jQuery);