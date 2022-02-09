class HierarchySelectItem {
	constructor(value, text, verticalIndex, horizontalIndex) {
		this.value = value;
		this.text = text;
		this.verticalIndex = verticalIndex
			? verticalIndex
			: Number.MAX_SAFE_INTEGER;
		this.horizontalIndex = horizontalIndex
			? horizontalIndex
			: Number.MAX_SAFE_INTEGER;
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

			document.items = this.items = [...this.options.items];
			this._rebuild();
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
				};
			};

			this.items.sort(getSort("verticalIndex"));

			var currentIndex = 0;
			var definedIndex = -1;
			this.items.forEach((item) => {
				if (
					currentIndex > 0 &&
					item.verticalIndex == definedIndex &&
					definedIndex != Number.MAX_SAFE_INTEGER
				) {
					item.verticalIndex = currentIndex;
					return;
				}

				definedIndex = item.verticalIndex;
				item.verticalIndex = ++currentIndex;
			});

			this.groupedItems = this.items.reduce((groups, item) => {
				var group = groups[item.verticalIndex] || [];
				group.push(item);
				groups[item.verticalIndex] = group;
				return groups;
			}, {});

			Object.keys(this.groupedItems).forEach((row) => {
				this.groupedItems[row].sort(getSort("horizontalIndex"));
				this.groupedItems[row].forEach((item, index) => {
					item.horizontalIndex = index + 1;
				});
			});
		},

		_build: function () {
			var self = this;
			//TODO: option to extract items from HTML?
			this.root.empty().addClass("hierarchy-select");

			this._buildVerticalDropper(0);
			Object.keys(this.groupedItems).forEach((row) => {
				self._buildRow(row, self.groupedItems[row]);
			});
		},

		_rebuild: function () {
			this._sortItems();
			this._build();
		},

		_buildRow: function (rowIndex, items) {
			var column = this._buildColumn(items);
			var $row = $("<li>")
				.addClass("hierarchy-select-row")
				.attr("data-index", rowIndex)
				.appendTo(this.root);

			this._buildColumn(items, $row);
			this._buildVerticalDropper(rowIndex);
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
						appendTo: "body",
						refreshPositions: true,
						revertDuration: 0,
						start: function (event, ui) {
							$(this).addClass("hierarchy-select-item-dragging");
						},
						stop: function (event, ui) {
							$(this).removeClass("hierarchy-select-item-dragging");
							$(".hierarchy-select-horizontal-dropper")
								.width("")
								.css("background", "");
							$(".hierarchy-select-vertical-dropper")
								.height("")
								.css("background", "");
						},
					});

				self._buildHorizontalDropper(item.horizontalIndex, $row);
			});
		},

		_buildVerticalDropper: function (index) {
			var self = this;
			var $dropper = $("<li>")
				.addClass("hierarchy-select-vertical-dropper")
				.attr("data-index", index)
				.appendTo(this.root)
				.droppable({
					accept: ".hierarchy-select-item",
					tolerance: "pointer",
					activeClass: "hierarchy-select-dropper-active",
					drop: function (event, ui) {
						var draggedItem = self.items.find(
							(item) => item.value == ui.draggable.data("value")
						);
						var newVerticalIndex = $(this).data("index");

						self._moveItemVertically(draggedItem, newVerticalIndex, true);
						self._rebuild();
					},
					over: function (event, ui) {
						var itemHeight = $(ui.draggable).height();
						$(this).height(itemHeight + 20);
						$(this).css("background", "#fafafa");
					},
					out: function (event, ui) {
						$(this).height("");
						$(this).css("background", "");
					},
				});
		},

		_buildHorizontalDropper: function (index, $row) {
			var self = this;
			var dropper = $("<div>")
				.addClass("hierarchy-select-horizontal-dropper")
				.attr("data-index", index)
				.appendTo($row)
				.droppable({
					accept: ".hierarchy-select-item",
					tolerance: "pointer",
					activeClass: "hierarchy-select-dropper-active",
					drop: function (event, ui) {
						var draggedItem = self.items.find(
							(item) => item.value == ui.draggable.data("value")
						);
						var newVerticalIndex = $(this)
							.parents(".hierarchy-select-row")
							.data("index");
						var newHorizontalIndex = $(this).data("index");

						self._moveItemVertically(draggedItem, newVerticalIndex);
						self._moveItemHorizontally(draggedItem, newHorizontalIndex);
						self._rebuild();
					},
					over: function (event, ui) {
						var itemWidth = $(ui.draggable).width();
						$(this).width(itemWidth + 40);
						$(this).css("background", "#fafafa");
					},
					out: function (event, ui) {
						$(this).width("");
						$(this).css("background", "");
					},
				});
		},

		_moveItem: function (movedItem, newIndex, property, considerGrouping, insert) {
			var self = this;

			if (!considerGrouping || insert) {
				self.items.forEach((item) => {
					let addition = item[property] > newIndex ? 1 : -1;
					item[property] = item[property] + addition;
				});
			}

			movedItem[property] = newIndex;
		},

		_moveItemVertically: function (movedItem, newIndex, insert = false) {
			this._moveItem(movedItem, newIndex, "verticalIndex", true, insert);
		},

		_moveItemHorizontally: function (movedItem, newIndex) {
			this._moveItem(movedItem, newIndex, "horizontalIndex", false);
		},

		getValue: function () {
			return this.items;
		},

		getGroupedValue: function () {
			return this.groupedItems;
		},

		setValue: function (items) {
			this.items = [...items];
			this._rebuild();
		},

		_destroy: function () {},
	});
});
