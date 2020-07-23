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
                    .insertAfter(this.element);

                this.tagList = $("<div>")
                    .addClass("multi-combobox-taglist form-control h-auto")
                    .appendTo(this.wrapper)
                    .tagList()
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
                        } else {
                            self.searchClear.show();
                        }
                    });

                this.searchClear = $("<i>")
                    .addClass("fas fa-times input-overlay-button")
                    .click(function() {
                        self.searchInput.val("");
                        self.searchInput.focus();
                    })
                    .hide();

                this.selectAll = $("<div>")
                        .addClass("custom-control custom-checkbox multi-combobox-seperator-bottom")
                        .append($("<input>")
                            .attr("id", "multi-combobox-select-all")
                            .attr("type", "checkbox")
                            .addClass("custom-control-input"))
                        .append($("<label>")
                            .attr("for", "multi-combobox-select-all")
                            .addClass("custom-control-label w-100")
                            .text("Select All"));

                this.selectList = $("<ul>")

                this.element.children("option").each(function () {
                        $("<li>")
                            .append($("<div>")
                                .addClass("custom-control custom-checkbox")
                                .append($("<input>")
                                    .attr("id", `option-${$(this).val()}`)
                                    .attr("type", "checkbox")
                                    .addClass("custom-control-input"))
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
                    .insertAfter(this.tagList);

            },

            showList: function() {
                var self = this;
                this.selectListWrapper.slideToggle("fast");
                self.searchInput.focus();
                $(document).on("click", function() {
                    self.hideList();
                });
            },

            hideList: function() {
                var $trigger = $(".multi-combobox-wrapper");
                if($trigger !== event.target && !$trigger.has(event.target).length){
                    this.selectListWrapper.slideUp("fast");
                }
                $(document).unbind("click", this.hideList)
            },

            _destroy: function () {

            }

        });

    $(".checkbox-select").multiSelectCheckbox();
});
