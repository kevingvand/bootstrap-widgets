$(function () {
    $.widget("custom.groupableTable",
        {
            options: {
                collapsibleGroups: true,
                showDropdownIcon: true,
                renamableGroups: true,
                allowGrouping: true,
                allowNesting: false
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
                            self._setupRowGroup($(this));
                        });
                }


            },

            _setupRowGroup: function ($row) {
                var self = this;

                var $nameCell = $row.find("td").first();
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
                                if ($(`[data-parent-name=${self._getValidGroupName(data.value)}]`).length)
                                    return false;

                                self._renameGroup(data.element.parents("tr").attr("data-group-name"), data.value);
                            }
                        });
                }

                if (self.options.showDropdownIcon) {
                    $("<td>")
                        .addClass("text-right")
                        .append($("<i>")
                            .addClass("fas fa-caret-down dropdown-icon flip"))
                        .appendTo($row);
                }

                $row.click(function () {
                    var $this = $(this);
                    if ($this.hasClass('clicked')) {
                        $this.removeClass('clicked');

                        if (self.options.renamableGroups) {
                            $this.find("span.group-title").editableLabel("toggle");
                        }

                    } else {
                        $this.addClass('clicked');
                        setTimeout(function () {
                            if ($this.hasClass('clicked')) {
                                $this.removeClass('clicked');

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

                            //TODO: if target is in group, dropping is only possible if nesting is on
                            //TODO: if source is last element in a group, leaving the group empty, remove the group

                            var groupName = self._getUniqueGroupName();
                            var $groupHeader = $("<tr>")
                                .attr("data-group-name", groupName)
                                .append($("<td>")
                                    .text(groupName)
                                    .attr("colspan", self.columnCount))
                                .insertAfter($(this))
                                .after($(this).attr("data-parent-name", groupName))
                                .after(ui.draggable.attr("data-parent-name", groupName));

                            self._setupRowGroup($groupHeader);

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

            _getUniqueGroupName: function () {
                var index = 1;
                var $group, groupName;

                do {
                    groupName = `group-${index++}`;
                    $group = this.wrapper.find(`[data-group-name=${groupName}]`);
                } while ($group.length)

                return groupName;
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

            _getValidGroupName: function (name) {
                //TODO: replace with window.toKebapCase

                return name
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .replace(/[\s_]+/g, '-')
                    .toLowerCase();
            },

            _renameGroup: function (oldName, newName) {
                newName = this._getValidGroupName(newName);
                $(`[data-group-name=${oldName}]`).attr("data-group-name", newName);
                $(`[data-parent-name=${oldName}]`).attr("data-parent-name", newName);
            },

            appendGroup: function (groupName) {

            },

            appendRow: function (groupName, $row) {

                if (!$row) {
                    this.wrapper.find("tr").last().after(groupName);
                    return;
                }

                var $predecessor = $(`[data-parent-name=${groupName}]`).last();

                if (!$predecessor.length)
                    $predecessor = $(`[data-group-name=${groupName}]`);

                if (!$predecessor.length)
                    $predecessor = this.wrapper.find("tr").last();

                $row.attr("data-parent-name", groupName);
                $predecessor.after($row);
            },

            _destroy: function () {

            }

        });

    $(".groupable-table").groupableTable();
});
