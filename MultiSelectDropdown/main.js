$(function () {
    $.widget("custom.multiSelectCheckbox",
        {
            options: {

            },

            _create: function () {
                this._build();
            },

            _build: function () {
                var self = this;

                this.element.hide();

                this.wrapper = $("<div>")
                    .addClass("multi-combobox-wrapper w-100")
                    .insertAfter(this.element)
                    .keyup(function () {
                        if (event.key === "Escape") {
                            self.selectListWrapper.slideUp("fast");
                        }

                        if (event.key === "ArrowUp") {
                            self._moveSelection(true);
                        }

                        if (event.key === "ArrowDown") {
                            self._moveSelection(false);
                        }

                        if (event.key === "Enter") {
                            var $selectedItem = self.selectList.find("li.selected");
                            if ($selectedItem.length) {
                                var $combobox = $selectedItem.find(".multi-combobox-option");
                                $combobox.prop("checked", !$combobox.prop("checked"));
                                $combobox.trigger("change");
                            }
                        }
                    });

                this.tagList = $("<div>")
                    .addClass("multi-combobox-taglist form-control h-auto")
                    .appendTo(this.wrapper)
                    .tagList({
                        closed: function (_, data) {
                            var $checkbox = $(`#option-${data.value}`);
                            $checkbox.prop("checked", false);
                            self._setSelectAll(false);
                        }
                    })
                    .click(function () {
                        self.showList();
                    });

                this.searchInput = $("<input>")
                    .addClass("w-100 p-2 multi-combobox-seperator-bottom")
                    .attr("type", "text")
                    .attr("placeholder", "search...")
                    .on('change keyup', function (e) {
                        if ($(this).val().length === 0) {
                            self.searchClear.hide();
                            self.selectList.children("li").show();
                            self.selectAll.show();
                            self.noResultsInfo.hide();
                        } else {
                            self.searchClear.show();
                            var query = $(this).val().toLowerCase();

                            var matchCount = 0;
                            self.selectList.children("li").each(function () {
                                if (!$(this).text().toLowerCase().includes(query)) {
                                    $(this).hide();
                                } else {
                                    $(this).show();
                                    matchCount++;
                                }
                            });

                            if (!matchCount) {
                                self.selectAll.hide();
                                self.noResultsInfo.show();
                            }
                            else {
                                self.selectAll.show();
                                self.noResultsInfo.hide();
                            }
                        }
                    });

                this.searchClear = $("<i>")
                    .addClass("fas fa-times input-overlay-button")
                    .click(function () {
                        self.searchInput.val("");
                        self.searchInput.trigger("change");
                        self.searchInput.focus();
                    })
                    .hide();

                this.selectAll = $("<div>")
                    .addClass("custom-control custom-checkbox multi-combobox-seperator-bottom")
                    .append($("<input>")
                        .attr("id", "multi-combobox-select-all")
                        .attr("type", "checkbox")
                        .addClass("custom-control-input")
                        .change(function () {
                            var isChecked = $(this).is(":checked");
                            self._setSelectAll(isChecked);

                            self.selectList.find(".multi-combobox-option").each(function () {
                                if ($(this).is(":checked") === isChecked) return;
                                $(this).prop("checked", isChecked);
                                $(this).trigger("change");
                            })
                        }))
                    .append($("<label>")
                        .attr("for", "multi-combobox-select-all")
                        .addClass("custom-control-label w-100")
                        .text("Select All"));

                this.noResultsInfo = $("<div>")
                    .append($("<div>")
                        .addClass("d-flex justify-content-center align-items-center")
                        .append($("<i>")
                            .addClass("fas fa-exclamation-circle m-2"))
                        .append($("<p>")
                            .addClass("my-2")
                            .text("No items found")))
                    .hide();

                this.selectList = $("<ul>")

                this.element.children("option").each(function () {
                    var $option = $(this);
                    $("<li>")
                        .append($("<div>")
                            .addClass("custom-control custom-checkbox")
                            .append($("<input>")
                                .attr("id", `option-${$(this).val()}`)
                                .attr("type", "checkbox")
                                .addClass("custom-control-input multi-combobox-option")
                                .change(function () {
                                    var isChecked = $(this).is(":checked");

                                    if (isChecked) {
                                        if (!self.selectList.find(".multi-combobox-option:not(:checked)").length)
                                            self._setSelectAll(true);

                                        self.tagList.tagList("addTag", $option.val(), $option.text());
                                    } else {
                                        self._setSelectAll(false);
                                        self.tagList.tagList("closeTag", $option.val(), $option.text());
                                    }
                                    self.searchInput.focus();
                                }))
                            .append($("<label>")
                                .attr("for", `option-${$(this).val()}`)
                                .addClass("custom-control-label w-100")
                                .text($(this).text()))
                        )
                        .data("value", $(this).val())
                        .appendTo(self.selectList);
                });

                this.selectListWrapper = $("<div>")
                    .addClass("multi-combobox-wrapper-dropdown mt-1")
                    .append($("<div>")
                        .addClass("btn-group w-100")
                        .append(this.searchInput)
                        .append(this.searchClear))
                    .append(this.selectAll)
                    .append(this.selectList)
                    .append(this.noResultsInfo)
                    .insertAfter(this.tagList);

                $(document).on("click", function () {
                    self.hideList();
                });
            },

            _setSelectAll: function (isChecked) {
                this.selectAll.find(".custom-control-label").text(isChecked ? "Deselect All" : "Select All");
                this.selectAll.find(".custom-control-input").prop("checked", isChecked);
            },

            _moveSelection: function (moveUp) {

                var selectedIndex = this.selectList.find("li.selected").first().index();

                if(moveUp && selectedIndex <= 0) {
                    this.selectList.find("li").removeClass("selected");
                    this.searchInput.focus();
                    return;
                }

                if (!moveUp && selectedIndex < 0) {
                    var $selectedItem = this.selectList.find("li").first();

                    $selectedItem.addClass("selected")
                    $selectedItem.get(0).scrollIntoView();
                    return;
                }

                var newIndex = selectedIndex + ((moveUp ? -1 : 1));
                var $selectedItem = this.selectList.find("li").eq(newIndex);

                if ($selectedItem.length) {
                    this.selectList.find("li").removeClass("selected");
                    $selectedItem.addClass("selected");
                    $selectedItem.get(0).scrollIntoView();
                }
            },

            showList: function () {
                var self = this;

                var isTag = $(event.target).parents(".tag").length || $(event.target).is(".action-icon")
                if (!isTag) {
                    this.selectListWrapper.slideToggle("fast");
                }

                self.searchInput.focus();
            },

            hideList: function () {
                var $trigger = $(".multi-combobox-wrapper");
                var isTag = $(event.target).parents(".tag").length || $(event.target).is(".action-icon")
                if ($trigger !== event.target && !$trigger.has(event.target).length && !isTag) {
                    this.selectListWrapper.slideUp("fast");
                }

            },

            _destroy: function () {

            }

        });

    $(".checkbox-select").multiSelectCheckbox();
});
