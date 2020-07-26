$(function () {
    $.widget("custom.editableLabel",
        {
            options: {
                type: "text",
                enableDoubleClick: true,
            },

            _create: function () {
                this.targetElement = this.element;
                this.editMode = false;

                if (!this.options.value)
                    this.options.value = this.targetElement.text();

                this._build();
            },

            _build: function () {
                var self = this;

                this.wrapper = $("<div>")
                    .addClass("editable-label")
                    .insertAfter(this.targetElement);

                this.targetElement
                    .appendTo(this.wrapper)
                    .dblclick(function () {
                        if (!self.editMode && self.options.enableDoubleClick) {
                            self.input.val(self.targetElement.text());
                            self.toggle(true);
                        }
                    });

                this.input = $("<input>")
                    .addClass(this.targetElement.attr("class"))
                    .attr("type", this.options.type)
                    .val(this.options.value)
                    .appendTo(this.wrapper)
                    .hide()
                    .blur(function () {
                        self.targetElement.text(self.input.val());
                        self.toggle(false);
                        self._trigger("edited", null, { value: self.input.val(), element: self.targetElement });
                    })
                    .keydown(function (e) {
                        if (e.keyCode === 27) { // Escape
                            self.toggle(false);
                        }
                        if (e.keyCode === 13) { // Enter
                            $(this).blur();
                        }
                    });
            },

            toggle(editMode) {

                if (editMode === undefined)
                    editMode = !editMode;

                this.editMode = editMode;
                if (editMode) {
                    this.targetElement.hide();
                    this.input
                        .show()
                        .focus()
                        .select();
                } else {
                    this.targetElement.show();
                    this.input.hide();
                }
            },

            _destroy: function () {

            }

        });
});