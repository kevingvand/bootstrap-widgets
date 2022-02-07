class HierarchySelectItem {
	constructor(value, text, verticalIndex, horizontalIndex) {
		this.value = value;
		this.text = text;
		this.verticalIndex = verticalIndex ? -1 : verticalIndex;
		this.horizontalIndex = horizontalIndex ? -1 : horizontalIndex;
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
			//TODO: sort items vertically
			//TODO: group items by row
			//TODO: sort grouped items horizontally

			this._build();
		},

		_build: function () {
			var self = this;
			//TODO: option to extract items from HTML?
			this.root.empty().addClass("hierarchy-select");

			this._buildVerticalDropper(0);
			this.items.forEach(item => {
				self._buildRow([item]);
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
					.appendTo($row);

				self._buildHorizontalDropper(item.horizontalIndex + 1, $row);
			});
		},

		_buildVerticalDropper: function (index) {
			var $dropper = $("<li>")
				.addClass("hierarchy-select-vertical-dropper")
				.attr("data-index", index)
				.appendTo(this.root);
		},

		_buildHorizontalDropper: function (index, $row) {
			var dropper = $("<div>")
				.addClass("hierarchy-select-horizontal-dropper")
				.attr("data-index", index)
				.appendTo($row);
		},

		_destroy: function () {},
	});
});
