$(function () {
    $.widget("custom.tagBlock",
        {
            options: {
                canClose: true,
                text: "",
                value: 0
            },

            _create: function () {
                this.wrapper = this.element;
                if (this.wrapper.is("[data-text]"))
                    this.options.text = this.wrapper.attr("data-text");

                if (this.wrapper.is("[data-value]"))
                    this.options.value = this.wrapper.attr("data-value");

                this._build();
            },

            _build: function () {
                var self = this;

                this.span = $("<span>")
                    .addClass("m-1")
                    .text(this.options.text)
                    .appendTo(this.wrapper);

                if (this.options.canClose) {
                    this.close = $("<span>")
                        .addClass(" m-1")
                        .click(function (e) {
                            self._trigger("closed",
                                null,
                                { value: self.value(), text: self.text(), element: self.wrapper });
                        })
                        .appendTo(this.wrapper)
                        .append(
                            $("<i>")
                                .addClass("fas fa-times action-icon"));
                }
            },

            value: function () {
                return this.options.value;
            },

            text: function () {
                return this.options.text;
            },

            close: function () {
                self._trigger("closed", null, { value: self.value(), text: self.text(), element: self.element });
            },

            _destroy: function () {
                this.span.remove();
                if (this.options.canClose)
                    this.close.remove();
            }

        });
});