(function ($, window, document, undefined) {

    $.widget('ce.resizableGrid', {

        _create: function () {
            this.resizing = false;
            this.totalColumns = 12;

            this._on({
                'mousedown .resizable-column-handle': '_resizeStartHandler',
                'mousemove': '_resizeHandler',
                'mouseup': '_resizeStopHandler',
                'mouseleave': '_resizeStopHandler',
                'touchstart  .resizable-column-handle': '_resizeStartHandler',
                'touchmove': '_resizeHandler',
                'touchend': '_resizeStopHandler',
                'touchcanel': '_resizeStopHandler'
            });
        },

        _init: function () {
            this._createHelpers();
        },

        _createHelpers: function () {
            this.element.addClass('resizable-grid');

            this.element.find('> .row:not(.resizable-row)').each(function (rowIndex, rowElement) {
                var row = $(rowElement);

                row.addClass('resizable-row');

                row.find('> [class^="col-"]:not(.resizable-column)').each(function (columnIndex, columnElement) {
                    $(columnElement)
                        .addClass('resizable-column')
                        .after($('<div>', { class: 'resizable-column-handle' }));
                });

                row.children(".resizable-column-handle").last().remove()
            });
        },

        _resizeStartHandler: function (event) {
            this.resizing = {};

            this.resizing.handle = $(event.currentTarget).addClass('resizable-column-handle-resizing');
            this.resizing.row = this.resizing.handle.closest('.resizable-row').addClass('resizable-row-resizing');
            this.resizing.directionIsWest = this._getResizingDirectionIsWest(event.pageX);
            this.resizing.columns = this.resizing.row.children(".resizable-column");
            this.resizing.offsets = this._getOffsets();

            this.element.addClass('resizable-grid-resizing');
        },

        _resizeHandler: function (event) {
            if (!this.resizing) return;

            var x = (event.touches) ? event.touches[0].pageX : event.pageX;
            this.resizing.directionIsWest = this._getResizingDirectionIsWest(x);

            this.resizing.growingColumn = (this.resizing.directionIsWest) ? this.resizing.handle.next(".resizable-column") : this.resizing.handle.prev(".resizable-column");
            this.resizing.staticColumns = (this.resizing.directionIsWest) ? this.resizing.growingColumn.nextAll(".resizable-column") : this.resizing.growingColumn.prevAll(".resizable-column");
            this.resizing.shrinkingColumns = (this.resizing.directionIsWest) ? this.resizing.growingColumn.prevAll(".resizable-column") : this.resizing.growingColumn.nextAll(".resizable-column");

            var growingColumnSize = this._getColumnSize(this.resizing.growingColumn);
            var hoveringColumn = this._getHoveringColumn(x);

            if(!hoveringColumn) return;
            var hoveringColumnIndex = hoveringColumn.index;

            var shrinkingColumnLength = this._getGridLength(this.resizing.shrinkingColumns);
            var staticColumnLength = this._getGridLength(this.resizing.staticColumns);

            var growingColumnIndex = this.resizing.directionIsWest ? shrinkingColumnLength : staticColumnLength;
            var growth = (this.resizing.directionIsWest) ? (growingColumnIndex - hoveringColumnIndex) : (hoveringColumnIndex - growingColumnIndex - growingColumnSize);

            if(growth <= 0) return;

            if ((growth + growingColumnSize + staticColumnLength + this.resizing.shrinkingColumns.length) > this.totalColumns) {
                growth = this.totalColumns - growingColumnSize - staticColumnLength - this.resizing.shrinkingColumns.length;
            }

            this._setColumnSize(this.resizing.growingColumn, growth + growingColumnSize);
            this._shrinkColumns(this.resizing.shrinkingColumns, growth);
        },

        _resizeStopHandler: function (event) {
            if (!this.resizing) return;

            this.resizing.handle.removeClass('resizable-column-handle-resizing');
            this.resizing.row.removeClass('resizable-row-resizing');
            this.element.removeClass('resizable-grid-resizing');

            this.resizing = false;
        },

        _getGridLength: function (columns) {
            var self = this;
            var length = 0;
            columns.each(function () {
                length += self._getColumnSize($(this));
            });

            return length;
        },

        _shrinkColumns: function (columns, decrease) {
            while (decrease > 0) {
                var widestColumn = this._getWidestColumn(columns);
                var widestColumnSize = this._getColumnSize(widestColumn);
                this._setColumnSize(widestColumn, widestColumnSize - 1);
                decrease -= 1;
            }
        },

        _getResizingDirectionIsWest: function (x) {
            var resizingDirectionIsWest = null;

            if(this.resizing.directionLastX) resizingDirectionIsWest = (x < this.resizing.directionLastX);
            this.resizing.directionLastX = x;

            return resizingDirectionIsWest;
        },

        _getHoveringColumn: function (x) {
            var self = this;
            var hoveringColumn;

            $.each(this.resizing.offsets, function (index, offset) {
                if (x >= offset.start && x <= offset.end) hoveringColumn = offset;
            });

            return hoveringColumn;
        },

        _getOffsets: function () {
            var columnWidth = this.resizing.row.width() / this.totalColumns;
            var start = this.resizing.columns.first().offset().left;
            var offsets = [];

            for (var i = 0; i < this.totalColumns; i++) {
                offsets.push({ index: i, start: start, end: start += columnWidth });
            }

            return offsets;
        },

        _getWidestColumn: function (columns) {
            var self = this;
            var widestColumn;

            columns.each(function () {
                if (!widestColumn || (self._getColumnSize($(this)) > self._getColumnSize(widestColumn))) {
                    widestColumn = $(this);
                }
            });

            return widestColumn;
        },

        _getNarrowestColumn: function (columns) {
            var self = this;
            var narrowestColumn;

            columns.each(function () {
                if (!narrowestColumn || (self._getColumnSize($(this)) < self._getColumnSize(narrowestColumn))) {
                    narrowestColumn = $(this);
                }
            });

            return narrowestColumn;
        },

        _getColumnSize: function (column) {
            var columnSize;

            $.each($.trim(column.attr('class')).split(' '), function (index, value) {
                if (value.match(/^col-[0-9]+/)) {
                    var parsedSize = parseInt($.trim(value).replace(/\D/g, ''), 10);
                    if (!columnSize || parsedSize > columnSize) columnSize = parsedSize;
                }
            });

            return columnSize;
        },

        _setColumnSize: function (column, size) {
            column.removeClass(`col-${this._getColumnSize(column)}`);
            column.addClass(`col-${size}`);
        },

        _destroy: function () {
            this.element.find('.resizable-column-handle').remove();
            this.element.find('.resizable-column').removeClass('resizable-column resizable-column-resizing');
            this.element.find('.resizable-row').removeClass('resizable-row resizable-row-resizing');
            this.element.removeClass('resizable-grid resizable-grid-resizing');
        }
    });

})(jQuery, window, document);

$('.grid').resizableGrid();