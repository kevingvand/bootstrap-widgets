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


            _slideRowGroup: function (name, close) {
                var self = this;

                var $headerRow = this.wrapper.find(`[data-group-name=${name}]`);
                var $bodyRow = this.wrapper.find(`[data-parent-name=${name}]`);

                if (close === undefined)
                    close = $bodyRow.find("td").is(":visible");

                if (close) {
                    $headerRow.find(".dropdown-icon")
                        .removeClass("flip");

                    $bodyRow.find("td")
                        .addClass("font-size-0")
                        .slideUp();
                } else {
                    $headerRow.find(".dropdown-icon")
                        .addClass("flip");

                    $bodyRow.find("td")
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
