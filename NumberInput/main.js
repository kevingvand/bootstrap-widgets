(function ($, window, document, undefined) {

    $.widget('custom.numberInput', {

        options: {
            value: 0,
            step: 1,
            min: Math.max(),
            max: Math.min(),
            allowBinary: true,
            allowHexadecimal: true,
            allowDecimal: true,
            allowFloat: true,
            seperateButtons: false,
        },

        _create: function () {
            this.input = this.element;

            this._build();
        },

        _build: function () {

            var self = this;

            this.wrapper = $("<div>")
                .addClass("number-input w-100")
                .insertAfter(this.input);

            var buttonStepDown = $("<button>")
                .addClass("btn btn-primary")
                .append($("<i>").addClass("fas fa-minus"))
                .click(function () { self.stepDown(); });

            var buttonStepUp = $("<button>")
                .addClass("btn btn-primary")
                .append($("<i>").addClass("fas fa-plus"))
                .click(function () { self.stepUp(); });


            if (this.options.seperateButtons) {

                this.wrapper.addClass("row");

                buttonStepDown
                    .addClass("col-1")
                    .appendTo(this.wrapper);

                $("<div>")
                    .addClass("col-10")
                    .append(this.input)
                    .appendTo(this.wrapper);

                buttonStepUp
                    .addClass("col-1")
                    .appendTo(this.wrapper);

            } else {

                this.wrapper.addClass("input-group");

                $("<div>")
                    .addClass("input-group-prepend")
                    .append(buttonStepDown)
                    .appendTo(this.wrapper);

                this.input.appendTo(this.wrapper);

                $("<div>")
                    .addClass("input-group-append")
                    .append(buttonStepUp)
                    .appendTo(this.wrapper);
            }

            this.input.on("input", function (e) {
                var inputValue = self.input.val();

                var newValue = NaN;
                if (inputValue.startsWith("0x") || inputValue.startsWith("0X")) {
                    newValue = parseInt(inputValue.substring(2), 16);
                } else if (inputValue.startsWith("0b") || inputValue.startsWith("0B")) {
                    newValue = parseInt(inputValue.substring(2), 2)
                } else if (self.options.allowFloat) {

                    if (inputValue.includes(",")) {
                        inputValue = inputValue.replace(",", ".");
                        self.input.val(inputValue);
                    }

                    newValue = parseFloat(inputValue);
                    if (newValue === undefined) newValue = NaN;
                } else {
                    newValue = parseInt(inputValue);
                }

                self.setValue((isNaN(newValue)) ? 0 : newValue);
            });

            this.input.on("keydown", function (e) {

                // Arrow up
                if (e.keyCode === 38) {
                    self.stepUp();
                }

                // Arrow down
                if (e.keyCode === 40) {
                    self.stepDown();
                }

                if (e.ctrlKey && e.altKey) {
                    if (e.keyCode === 68 && self.options.allowDecimal) {
                        self.input.val(self.options.value.toString(10));
                    }

                    if (e.keyCode === 72 && self.options.allowHexadecimal) {
                        self.input.val(`0x${self.options.value.toString(16)}`);
                    }

                    if (e.keyCode === 66 && self.options.allowBinary) {
                        self.input.val(`0b${self.options.value.toString(2)}`);
                    }
                }

                let charCode = event.keyCode - 48 * Math.floor(event.keyCode / 48);
                let keyString = String.fromCharCode((96 <= event.keyCode) ? charCode : event.keyCode);
                var currentValue = self.input.val();
                var futureValue = `${currentValue.slice(0, e.target.selectionStart)}${keyString}${currentValue.slice(e.target.selectionEnd, currentValue.length)}`

                if (!e.ctrlKey && !e.altKey && e.keyCode !== 8) {
                    if (!self._validateInput(futureValue)) return false;
                }
            });

            this.input.on("paste", function (e) {
                var pastedText = event.clipboardData.getData('Text');
                var currentValue = self.input.val();
                var futureValue = `${currentValue.slice(0, e.target.selectionStart)}${pastedText}${currentValue.slice(e.target.selectionEnd, currentValue.length)}`

                if (!self._validateInput(futureValue)) return false;
            });

        },

        _setFormattedValue: function (value) {
            var input = this.input.val();

            if (input.startsWith("0x") || input.startsWith("0X")) {
                this.input.val(`0x${value.toString(16).toUpperCase()}`);
            } else if (input.startsWith("0b") || input.startsWith("0B")) {
                this.input.val(`0b${value.toString(2)}`);
            } else {
                this.input.val(value.toString());
            }
        },

        _validateInput: function (input) {

            var isDecimal = isHexadecimal = isBinary = isFloat = false;

            if (this.options.allowDecimal) {
                isDecimal = /(^(-?)[0-9]*$)/.test(input);
            }

            if (this.options.allowFloat) {
                isFloat = /^[0-9]+[,.]?[0-9]*[eE]?[-+]?[0-9]*$/.test(input);
            }

            if (this.options.allowHexadecimal) {
                isHexadecimal = /(^0[xX][0-9a-fA-F]*$)/.test(input);
            }

            if (this.options.allowBinary) {
                isBinary = /(^0[bB][10]*$)/.test(input);
            }

            return (isDecimal || isHexadecimal || isBinary || isFloat);
        },

        setValue: function (value) {
            this.options.value = value;

            if (value > this.options.max) {
                this.options.value = this.options.max;
                this._setFormattedValue(this.options.max);
            }

            if (value < this.options.min) {
                this.options.value = this.options.min;
                this._setFormattedValue(this.options.min);
            }
        },

        stepUp: function (step) {
            if (step == undefined)
                step = this.options.step;

            this.options.value += step;
            this.setValue(this.options.value);

            if (this.input.val().startsWith("0x")) {
                this.input.val(`0x${this.options.value.toString(16)}`);
            } else if (this.input.val().startsWith("0b")) {
                this.input.val(`0b${this.options.value.toString(2)}`);
            } else if (this.input.val().toLowerCase().includes("e")) {
                this.input.val(this.options.value.toExponential());
            } else {
                this.input.val(this.options.value);
            }
        },

        stepDown: function (step) {
            if (step == undefined)
                step = this.options.step;

            this.stepUp(-step);
        },

        value: function () {
            return this.options.value;
        },

        _destroy: function () {
            this.input
                .insertAfter(this.wrapper);

            this.wrapper.remove();
        }
    });

})(jQuery, window, document);

$('.numberInput').numberInput();