$(function () {
    $.widget("custom.groupableTable",
        {
            options: {
                showDropdownIcon: true,
            },

            _create: function () {
                this.wrapper = this.element;
                this.columnCount = this.wrapper.find("thead").first().find("th").length;

                this._build();
            },

            _build: function () {
                var self = this;

                this.wrapper.find("[data-group-name]")
                    .addClass("cursor-pointer")
                    .each(function () {
                        $(this).find("td").first().attr("colspan", self.columnCount - 1);

                        $("<td>")
                            .addClass("text-right")
                            .append($("<i>")
                                .addClass("fas fa-caret-down dropdown-icon flip"))
                            .appendTo($(this));
                    })
                    .click(function () {
                        var name = $(this).attr("data-group-name");
                        self._slideRowGroup(name);
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

            _destroy: function () {

            }

        });

    $(".groupable-table").groupableTable();
});
