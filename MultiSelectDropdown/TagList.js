$(function () {
    $.widget("custom.tagList",
        {
            options: {
                tags: [],
                noTagsInfo: "This tag list is currently empty."
            },

            _create: function () {
                this.wrapper = this.element;
                this._build();
            },

            _build: function () {
                var self = this;

                this.noTagsInfo = $("<span>")
                    .append($("<i>")
                        .addClass("fa fa-info-circle mx-2"))
                    .append($("<span>")
                        .text(self.options.noTagsInfo))
                    .appendTo(this.wrapper);

                if (self.options.tags.length) {
                    this.noTagsInfo.hide();
                }

                $.each(self.options.tags,
                    function (_, tag) {
                        self._buildTag(tag);
                    });
            },

            _buildTag: function (tag) {
                var self = this;

                return $("<div>")
                    .addClass("tag mx-1")
                    .appendTo(self.wrapper)
                    .tagBlock({ value: tag.value, text: tag.text },
                        {
                            closed: function (event, data) {
                                var tagIndex = self.options.tags.findIndex(t => t.value === data.value && t.text === data.text);
                                if (tagIndex >= 0) {
                                    data.element.remove();
                                    self.options.tags.splice(tagIndex, 1);
                                    self._toggleNoTagsInfo();
                                    self._trigger("closed", null, data);
                                }
                            }
                        });
            },

            _toggleNoTagsInfo: function () {
                if (!this.options.tags.length)
                    this.noTagsInfo.show();
                else this.noTagsInfo.hide();
            },

            addTag: function (value, text) {
                if (!text) text = value;

                var tag = { value: value, text: text };
                tag.element = this._buildTag(tag);

                this.options.tags.push(tag);
                this._toggleNoTagsInfo();
            },

            closeTag: function (value, text) {
                var tagIndex = -1;

                while (true) {

                    var tagIndex = this.options.tags.findIndex(tag => tag.value === value && tag.text === text);
                    if (tagIndex < 0) {
                        break;
                    }

                    $(this.options.tags[tagIndex].element).tagBlock("closeTag");
                }
            },

            values: function () {
                return this.options.tags;
            },

            _destroy: function () {
                this.wrapper.html("");
            }

        });

});