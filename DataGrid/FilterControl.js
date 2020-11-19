$.widget("custom.filterControl",
    {
        options: {
            addSearch: true
        },
        _create: function () {
            var self = this;

            this.wrapper = this.element;
            this.menuToggle = this.options.menu;
            if (this.options.menu) {
                this.menuToggle.parent().on("shown.bs.dropdown",
                    function () {
                        self.searchInput.focusNoScroll();
                    });
            }

            this.filters = [];
            this.defaults = [];
            this.appliedFilters = [];

            this._extractFilters();
            if (this.options.menu) this._buildMenu();
            this.applyFilter();
        },

        _extractFilters: function () {

            var self = this;
            var filterItems = this.wrapper.find("[data-enable-filter]");

            $.each(Object.keys(this.wrapper.data()),
                function (_, value) {
                    if (value.startsWith("filter")) {
                        var values = self.wrapper.data(value).split("|");
                        if (!self.defaults[value]) self.defaults[value] = [...values];
                        else {
                            $.each(values,
                                function (_, defaultValue) {
                                    if (!self.defaults[value].includes(defaultValue))
                                        self.defaults[value].push(defaultValue);
                                });
                        }
                    }
                });

            filterItems.each(function () {
                var $filterItem = $(this);
                $.each(Object.keys($(this).data()),
                    function (_, value) {
                        if (value.startsWith("filter")) {

                            var filterItemValues = $filterItem.data(value).split("|");
                            if (!self.filters[value]) self.filters[value] = [...filterItemValues];
                            else {
                                $.each(filterItemValues,
                                    function (_, filterItemValue) {
                                        if (!self.filters[value].includes(filterItemValue))
                                            self.filters[value].push(filterItemValue);
                                    });
                            }
                        }
                    });
            });
        },

        _buildSearch: function () {
            var self = this;

            var searchItem = $("<li>")
                .addClass("dropdown-item dropdown-item-static")
                .appendTo(self.menu);

            var searchWrapper = $("<div>")
                .addClass("search")
                .appendTo(searchItem);

            this.searchInput = $("<input>")
                .addClass("form-control search")
                .attr("type", "text")
                .attr("placeholder", "Search...")
                .keyup(function (event) {
                    self.applyFilter();
                    if (event.which === 13) {
                        self.menu.removeClass("show");
                    }
                })
                .appendTo(searchWrapper);
        },

        _buildFilterSwitch: function (filter, value) {
            var self = this;

            var itemWrapper = $("<li>")
                .addClass("dropdown-item dropdown-item-switch");

            $("<span>")
                .text(value)
                .appendTo(itemWrapper);

            var switchWrapper = $("<div>")
                .addClass("custom-control custom-switch custom-switch-no-label")
                .appendTo(itemWrapper);

            var switchInput = $("<input>")
                .addClass("custom-control-input")
                .attr("type", "checkbox")
                .change(function () {
                    var isChecked = $(this).prop("checked");
                    if (isChecked) self.addFilter(filter, value);
                    else self.removeFilter(filter, value);
                })
                .appendTo(switchWrapper);

            if (this.defaults[filter] && this.defaults[filter].includes(value)) {
                switchInput.attr("checked", "");
                self.addFilter(filter, value);
            }

            var switchLabel = $("<label>")
                .addClass("custom-control-label")
                .appendTo(switchWrapper);

            return itemWrapper;
        },

        _buildFilter: function (name, values) {
            var self = this;

            var filterItem = $("<li>")
                .addClass("dropdown-item")
                .appendTo(self.menu);

            var filterAnchor = $("<a>")
                .addClass("dropdown-toggle")
                .text(name.substring(6))
                .appendTo(filterItem);

            var filterMenu = $("<ul>")
                .addClass("dropdown-menu")
                .attr("aria-expanded", "false")
                .appendTo(filterItem);

            $.each(values,
                function (_, value) {
                    $(self._buildFilterSwitch(name, value))
                        .appendTo(filterMenu);
                });
        },

        _buildMenu: function () {
            var self = this;

            this.menuToggle
                .attr("href", "")
                .attr("data-toggle", "dropdown");

            this.menu = $("<ul>")
                .addClass("dropdown-menu nested-dropdown dropright")
                .attr("aria-expanded", "false")
                .insertAfter(this.menuToggle);

            if (this.options.addSearch)
                this._buildSearch();

            $.each(Object.keys(self.filters),
                function (_, value) {
                    self._buildFilter(value, self.filters[value]);
                });
        },

        addFilter: function (filter, value) {
            var self = this;

            if (!Object.keys(self.appliedFilters).includes(filter))
                self.appliedFilters[filter] = [value];
            else self.appliedFilters[filter].push(value);

            self.applyFilter();
        },

        removeFilter: function (filter, value) {
            var self = this;

            if (!Object.keys(self.appliedFilters).includes(filter)) return;
            self.appliedFilters[filter].splice(self.appliedFilters[filter].indexOf(value), 1);

            self.applyFilter();
        },

        applyFilter: function () {
            var self = this;

            var filterItems = this.wrapper.find("[data-enable-filter]");

            filterItems.each(function () {
                var $filterItem = $(this);
                var appliedFilterKeys = Object.keys(self.appliedFilters);
                var isHidden = false;
                $.each(Object.keys($(this).data()),
                    function (_, value) {
                        if (appliedFilterKeys.includes(value)) {

                            var filterValues = $filterItem.data(value).split("|");

                            if (self.appliedFilters[value].length <= 0) {
                                return true;
                            }

                            $.each(filterValues,
                                function (_, filterValue) {
                                    isHidden = (!self.appliedFilters[value].includes(filterValue));
                                    if (!isHidden) {
                                        return false;
                                    }
                                });

                            if (isHidden) return false;
                        }
                    });

                if (self.searchInput && self.searchInput.val()) {
                    var searchContent = $filterItem.data("search");
                    if (!searchContent ||
                        !searchContent.toLowerCase().includes(self.searchInput.val().toLowerCase()))
                        isHidden = true;
                }

                $filterItem.attr("hidden", isHidden);
            });
        }
    });