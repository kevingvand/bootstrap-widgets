$(function () {
    $.widget("custom.collapsibleCard",
        {
            options: {
                collapsed: true
            },
            _create: function () {
                this.card = this.element;
                this.body = $(this.element.find(".card-body"));

                this._build();

                if (this.options.collapsed) this.close();
                else this.open();
            },

            _build: function () {
                var self = this;
                this.cardTitle = this.body.children(".card-title");
                if (!this.cardTitle) return;

                this.titleWrapper = $("<a>")
                    .addClass("action")
                    .click(function (e) {
                        
                        if($(e.target).is(".btn") ||$(e.target).parents(".btn").length) {
                            return false;
                        }
                        self.toggle();
                    });

                this.hasActions = this.cardTitle.find(".card-actions").length;
                var iconLocation = this.titleWrapper;
                if (this.hasActions) {
                    iconLocation = this.cardTitle.find(".card-actions")
                    this.cardTitle.addClass("d-flex justify-content-between");
                } else {
                    this.titleWrapper.addClass("d-flex justify-content-between");
                }

                this.cardTitle.appendTo(this.titleWrapper);

                this.openIcon = $("<span>")
                    .append($("<i>").addClass("fas fa-plus ml-2"))
                    .appendTo(iconLocation);

                this.closeIcon = $("<span>")
                    .append($("<i>").addClass("fas fa-minus ml-2"))
                    .hide()
                    .appendTo(iconLocation);

                this.contentWrapper = $("<div>")
                    .addClass("card-content collapse");

                this.body.children().appendTo(this.contentWrapper);

                this.titleWrapper.appendTo(this.body);
                this.contentWrapper.appendTo(this.body);

            },

            toggle: function () {
                if (this.options.collapsed)
                    this.open();
                else
                    this.close();
            },

            open: function () {

                this.contentWrapper.collapse("show");
                this.cardTitle.removeClass("mb-0");
                this.cardTitle.find(".card-actions .btn").show();

                this.closeIcon.show();
                this.openIcon.hide();

                this.options.collapsed = false;
            },

            close: function () {

                this.contentWrapper.removeClass("show");
                this.contentWrapper.collapse("hide");
                this.cardTitle.find(".card-actions .btn").hide();

                this.cardTitle.addClass("mb-0");

                this.closeIcon.hide();
                this.openIcon.show();

                this.options.collapsed = true;
            }
        });

    $(".collapsible-card").collapsibleCard({ collapsed: false });
});