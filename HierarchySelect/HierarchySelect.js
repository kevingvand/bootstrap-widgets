class HierarchySelectItem {
	constructor(value, text, verticalIndex, horizontalIndex) {
		this.value = value;
		this.text = text;
		this.verticalIndex = verticalIndex ? verticalIndex : Number.MAX_SAFE_INTEGER;
		this.horizontalIndex = horizontalIndex ? horizontalIndex : Number.MAX_SAFE_INTEGER;
	}
}

$(function () {
	$.widget("custom.hierarchySelect", {
		options: {
			items: [],
		},

		_create: function () {
			this.root = this.element;

			if (!this.root.is("ul")) {
				console.error(
					"Cannot initialize hierarchy select, root element must be of type ul."
				);
				return;
			}

			this.items = [...this.options.items];
			this._sortItems();
			
			this._build();
		},

		_sortItems: function () {
			var getSort = function (property) {
				return function (a, b) {
					if (a[property] < b[property]) {
						return -1;
					}

					if (a[property] > b[property]) {
						return 1;
					}

					return 0;
				}
			}

			this.items.sort(getSort("verticalIndex"));

			var currentIndex = 1;
			var definedIndex = -1;
			this.items.forEach((item, index) => {
				if(definedIndex == -1) definedIndex = item.verticalIndex;

				if(item.verticalIndex != currentIndex && item.verticalIndex == definedIndex && definedIndex != Number.MAX_SAFE_INTEGER)
				{
					item.verticalIndex = currentIndex;
					return;
				} 

				definedIndex = item.verticalIndex;
				item.verticalIndex = ++currentIndex;
			});

			this.groupedItems = this.items.reduce((groups, item) => {
				var group = (groups[item.verticalIndex] || []);
				group.push(item);
				groups[item.verticalIndex] = group;
				return groups;
			}, {});

			Object.keys(this.groupedItems).forEach(row => {
				this.groupedItems[row].sort(getSort("horizontalIndex"));
			});
		},

		_build: function () {
			var self = this;
			//TODO: option to extract items from HTML?
			this.root.empty().addClass("hierarchy-select");

			this._buildVerticalDropper(0);
			Object.keys(this.groupedItems).forEach(row => {
				self._buildRow(self.groupedItems[row]);
			});
		},

		_buildRow: function (items) {
			var column = this._buildColumn(items);
			var $row = $("<li>").addClass("hierarchy-select-row").appendTo(this.root);

			this._buildColumn(items, $row);
			this._buildVerticalDropper(1);
		},

		_buildColumn: function (items, $row) {
			var self = this;
			this._buildHorizontalDropper(0, $row);
			items.forEach((item) => {
				$("<div>")
					.addClass("hierarchy-select-item")
					.attr("data-value", item.value)
					.text(item.text)
					.appendTo($row)
					.draggable({
						revert: true,
						helper: "clone",
						refreshPositions: true,
						start: function (event, ui) {
							$(this).addClass("hierarchy-select-item-dragging");
						},
						stop: function (event, ui) {
							$(this).removeClass("hierarchy-select-item-dragging");
							$(".hierarchy-select-horizontal-dropper").width("");
						}
					});

				self._buildHorizontalDropper(item.horizontalIndex + 1, $row);
			});
		},

		_buildVerticalDropper: function (index) {
			var $dropper = $("<li>")
				.addClass("hierarchy-select-vertical-dropper")
				.attr("data-index", index)
				.appendTo(this.root)
				.droppable({
					accept: '.hierarchy-select-item',
					tolerance: "pointer",
					activeClass: "hierarchy-select-dropper-active",
					drop: function (event, ui) {

					},
					over: function (event, ui) {

					}
				});
		},

		_buildHorizontalDropper: function (index, $row) {
			var dropper = $("<div>")
				.addClass("hierarchy-select-horizontal-dropper")
				.attr("data-index", index)
				.appendTo($row)
				.droppable({
					accept: '.hierarchy-select-item',
					tolerance: "pointer",
					activeClass: "hierarchy-select-dropper-active",
					drop: function (event, ui) {

					},
					over: function (event, ui) {
						var itemWidth = $(ui.draggable).width();

						$(this).width(itemWidth + 40);
					},
					out: function (event, ui) {
						$(this).width("");
					}
				});
		},

		_destroy: function () { },
	});
});
