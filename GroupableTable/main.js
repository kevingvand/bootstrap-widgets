$(function () {
    $.widget("custom.groupableTable",
        {
            options: {
                collapsibleGroups: true,
                showDropdownIcon: true,
                renamableGroups: true,
            },

            _create: function () {
                this.wrapper = this.element;
                this.columnCount = this.wrapper.find("thead").first().find("th").length;

                this._build();
                this._setupGrouping();
            },

            _build: function () {
                var self = this;


                var $rowHeaders = this.wrapper.find("[data-group-name]");

                if (this.options.collapsibleGroups) {
                    $rowHeaders
                        .addClass("cursor-pointer")
                        .each(function () {
                            var $nameCell = $(this).find("td").first();
                            $nameCell.attr("colspan", self.columnCount - (self.options.showDropdownIcon ? 1 : 0));

                            if (self.options.renamableGroups) {
                                var text = $nameCell.text();
                                $nameCell.text("");

                                $("<span>")
                                    .addClass("group-title")
                                    .text(text)
                                    .appendTo($nameCell)
                                    .editableLabel({ enableDoubleClick: false }, {
                                        "edited": function (_, data) {
                                            self._renameGroup(data.element.parents("tr").attr("data-group-name"), data.value);
                                        }
                                    });
                            }

                            if (self.options.showDropdownIcon) {
                                $("<td>")
                                    .addClass("text-right")
                                    .append($("<i>")
                                        .addClass("fas fa-caret-down dropdown-icon flip"))
                                    .appendTo($(this));
                            }
                        })
                }

                $rowHeaders.click(function () {
                    var $this = $(this);
                    if ($this.hasClass('clicked')) {
                        $this.removeClass('clicked');

                        // DOUBLE CLICK

                        if (self.options.renamableGroups) {
                            $this.find("span.group-title").editableLabel("toggle");
                        }

                    } else {
                        $this.addClass('clicked');
                        setTimeout(function () {
                            if ($this.hasClass('clicked')) {
                                $this.removeClass('clicked');

                                // SINGLE CLICK

                                if (self.options.collapsibleGroups) {
                                    var name = $this.attr("data-group-name");
                                    self._slideRowGroup(name);
                                }
                            }
                        }, 250);
                    }
                });
            },

            _setupGrouping: function () {

                var self = this;

                this.wrapper.find("tr:not([data-group-name])").draggable({
                    helper: this._dragHelperRow,
                    start: this._dragStart,
                    stop: this._dragStop
                });

                this.wrapper.find("tbody:not([data-parent-name]) > tr:not([data-group-name])").droppable({
                    over: this._dropOver,
                    out: this._dropOut,
                    drop: function (event, ui) {
                        $(this).removeClass("drop-hover");
                        var droppedGroup = ui.draggable.is("[data-group-name]");

                        if (!droppedGroup) {

                            var $groupHeader = $("<tr>")
                                .attr("data-group-name", "Group")
                                .append($("<td>")
                                    .text("Group")
                                    .attr("colspan", self.columnCount))
                                .insertAfter($(this))
                                .after($("<tbody>")
                                    .attr("data-parent-name", "Group")
                                    .append($(this))
                                    .append(ui.draggable));

                            //DRAG = TR & DROP = TR --> Create new group
                        } else {
                            // DRAG = TG & DROP = TR --> Create new group and add nested group (if nested is on)
                        }
                    }
                });

                this.wrapper.find("tr[data-group-name]").droppable({
                    over: this._dropOver,
                    out: this._dropOut,
                    drop: function (event, ui) {
                        $(this).removeClass("drop-hover");
                        var droppedGroup = ui.draggable.is("[data-group-name]");

                        if (!droppedGroup) {
                            //DRAG = TR & DROP = TG --> Add row to group
                        } else {
                            // DRAG = TG & DROP = TG --> Add (drag) group to (drop) group (if nested is on)
                        }
                    }
                });

            },

            _dragHelperRow: function () {
                var $helper = $("<div>")
                    .append($("<table>")
                        .addClass("table row-adorner")
                        .width($(this).width())
                        .append($(this).clone()));

                return $helper;
            },

            _dragStart: function () {
                $(this).addClass("row-dragging");
            },

            _dragStop: function () {
                $(this).removeClass("row-dragging");
            },

            _dropOver: function () {
                $(this).addClass("drop-hover");
            },

            _dropOut: function () {
                $(this).removeClass("drop-hover");
            },

            _slideRowGroup: function (name, close) {

                var self = this;

                var $headerRow = this.wrapper.find(`[data-group-name=${name}]`);
                var $bodyRows = this.wrapper.find(`[data-parent-name=${name}]`);

                if (close === undefined)
                    close = $bodyRows.find("td").is(":visible");

                if (close) {
                    $headerRow.find(".dropdown-icon")
                        .removeClass("flip");

                    $bodyRows.find("td")
                        .addClass("font-size-0")
                        .slideUp();
                } else {
                    $headerRow.find(".dropdown-icon")
                        .addClass("flip");

                    $bodyRows.find("td")
                        .slideDown()
                        .removeClass("font-size-0")
                }
            },

            _renameGroup: function (oldName, newName) {
                newName = newName
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .replace(/[\s_]+/g, '-')
                    .toLowerCase()
                //TODO: replace with window.toKebapCase
                $(`[data-group-name=${oldName}]`).attr("data-group-name", newName);
                $(`[data-parent-name=${oldName}]`).attr("data-parent-name", newName);
            },

            _destroy: function () {

            }

        });

    $(".groupable-table").groupableTable();
});
