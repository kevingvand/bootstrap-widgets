$(function () {
    $.widget("custom.fileInput",
        {
            options: {
                allowMultiple: false,
                allowImages: true,
                allowPDF: true,
                showPreview: true,
                allowDropText: "Drop your files here",
                blockDropText: "The type of the selected file(s) is not allowed!"
            },

            _create: function () {
                this.fileInput = this.element;

                if (!this.fileInput.is("[type=file]")) {
                    console.error("Cannot initialize file input, input is not of type file")
                    return;
                }

                if (!this.fileInput.is("[id]")) {
                    console.error("Cannot initialize file input, input has no id")
                    return;
                }

                this.id = this.fileInput.attr("id");

                if (this.fileInput.is("[multiple]"))
                    this.options.allowMultiple = this.fileInput.attr("multiple") == "true";

                this._build();
            },

            _build: function () {
                var self = this;

                $(window)
                    .on("dragenter", (event) => {
                        $("body").addClass("pointer-events-none");
                        self.inputGroup.hide();
                        self.dropZone.show();

                        var files = event.originalEvent.dataTransfer.items;
                        if (!files) return false;

                        this.allowDrop = self._areFilesAllowed(files);

                        if (!this.allowDrop) {
                            self.dropZone.find("p").text(self.options.blockDropText);
                        } else {
                            self.dropZone.find("p").text(self.options.allowDropText);
                        }
                    })
                    .on("dragleave", (event) => {
                        var $newTarget = $(event.originalEvent.relatedTarget);
                        if (!$newTarget.parents("html").length && !$newTarget.is("html")) {
                            $("body").removeClass("pointer-events-none");
                            self.dropZone.hide();
                            self.inputGroup.show();

                            self.dropZone.find("p").text(self.options.allowDropText);
                        }
                    });

                this.wrapper = $("<div>")
                    .addClass("file-input-wrapper w-100")
                    .insertAfter(this.fileInput);

                this._setAccept();

                if (this.options.showPreview) {
                    this.previewWrapper = $("<div>")
                        .addClass("file-input-preview")
                        .appendTo(this.wrapper);
                }

                this.fileInput
                    .appendTo(this.wrapper)
                    .on("change", () => self._fileSelected())
                    .hide();

                this.fileNameInput = $("<input>")
                    .attr("type", "text")
                    .addClass("form-control")
                    .attr("readonly", "")
                    .dblclick(() => {
                        self.fileInput.click();
                    });

                this.fileBrowseButton = $("<label>")
                    .addClass("btn btn-primary")
                    .attr("for", this.id)
                    .text("Choose file");

                this.inputGroup = $("<div>")
                    .addClass("input-group")
                    .append(this.fileNameInput)
                    .append($("<div>")
                        .addClass("input-group-append")
                        .append(this.fileBrowseButton))
                    .appendTo(this.wrapper);

                this.dropZone = $("<div>")
                    .addClass("file-input-drop")
                    .append($("<p>")
                        .text(this.options.allowDropText))
                    .appendTo(this.wrapper)
                    .on("dragenter", (event) => {
                        event.preventDefault();
                        if (this.allowDrop)
                            self.dropZone.addClass("file-input-drop-over");
                    })
                    .on("dragover", (event) => {
                        event.preventDefault();
                    })
                    .on("dragleave", (event) => {
                        event.preventDefault();
                        var $newTarget = $(event.originalEvent.relatedTarget);

                        if (!$newTarget.parents(".file-input-drop").length)
                            self.dropZone.removeClass("file-input-drop-over");
                    })
                    .on("drop", (event) => {
                        event.preventDefault();

                        self.dropZone.removeClass("file-input-drop-over");
                        self.dropZone.hide();
                        self.inputGroup.show();

                        if (!this.allowDrop) return false;

                        console.log(event.originalEvent.dataTransfer.files);
                        //TODO: allow for multi select
                        this.fileInput.prop("files", event.originalEvent.dataTransfer.files);
                        this.fileInput.trigger("change");
                    })
                    .hide();
            },

            _buildPreviewItem: function (file) {

                var self = this;

                var item = $("<div>")
                    .addClass("file-input-preview-item d-flex flex-column justify-content-between align-items-center")
                    .attr("data-name", file.name);

                var buttonWrapper = $("<div>")
                    .addClass("file-input-preview-item-close")
                    .appendTo(item);

                var closeButton = $("<button>")
                    .addClass("btn btn-primary badge")
                    .append($("<i>")
                        .addClass("fas fa-times"))
                    .click(() => {
                        closeButton.parents(".file-input-preview-item").remove();
                        self._removeFile(file);
                    })
                    .appendTo(buttonWrapper);


                var iconWrapper = $("<div>")
                    .addClass("file-input-preview-item-icon d-flex")
                    .appendTo(item);

                if (file.type.startsWith("image/")) {
                    this._getBase64(file, (src) => {
                        $("<img>")
                            .attr("src", src)
                            .appendTo(iconWrapper);
                    })
                }

                if (file.type.startsWith("application/pdf")) {
                    $("<span>")
                        .append($("<i>")
                            .addClass("fas fa-4x fa-file-pdf"))
                        .appendTo(iconWrapper);
                }

                $("<span>")
                    .addClass("file-input-preview-item-name")
                    .text(file.name)
                    .appendTo(item);

                return item;
            },

            _removeFile: function (file) {

            },

            _getBase64: function (file, callback) {
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    callback(reader.result);
                };
                reader.onerror = function (error) {
                    console.log('Error: ', error);
                };
            },

            _setAccept: function () {
                var accept = [];
                if (this.options.allowImages)
                    accept.push("image/*");

                if (this.options.allowPDF)
                    accept.push(".pdf");

                this.fileInput.attr("accept", accept.join(","));
            },

            _areFilesAllowed: function (files) {
                for (var i = 0; i < files.length; i++) {
                    if (!this._isFileAllowed(files[i])) return false;
                }

                return true;
            },

            _isFileAllowed: function (file) {

                var prefixes = [];
                if (this.options.allowImages)
                    prefixes.push("image/");

                if (this.options.allowPDF)
                    prefixes.push("application/pdf");

                return prefixes.some(prefix => file.type.startsWith(prefix));
            },

            _fileSelected: function () {
                var files = this.fileInput[0].files;
                if (!files || !files.length) return;

                var file = files[0]; // Allow for multiple

                this.fileNameInput.val(file.name); // Allow for multiple

                if (this.options.showPreview) {
                    var previewItem = this._buildPreviewItem(file);
                    previewItem.appendTo(this.previewWrapper);
                }
            },

            _destroy: function () {
                this.fileInput
                    .insertBefore(this.wrapper)
                    .show();
            }
        });

    $("input[type=file]").fileInput();
});