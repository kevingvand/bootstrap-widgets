$(function () {
	$.widget("custom.treeView", {
		options: {
			allowSelect: true,
			leafSelectOnly: false,
			onItemToggle: null,
		},

		_create: function () {
			this.root = this.element;
			this.selectedItem = null;

			this._build();
		},

		_build: function () {
			this.root.addClass("tree-view-list");

			if (this.options.allowSelect)
				this.root.addClass("tree-view-list-selectable");

			this.root.find("ul").addClass("tree-view-sub-list");
			this._processItems(this.root);
		},

		_processItems: function ($list, level = 0) {
			var self = this;

			$list.children().each(function () {
				var $listItem = $(this);
				$listItem.addClass("tree-view-list-item").attr("data-level", level);

				var itemText = $listItem.contents().get(0).nodeValue.trim();
				var $subList = $listItem.children("ul");

				var $listItemStatusIcon = $("<span>").addClass(
					"tree-view-list-item-status"
				);

				var $listItemWrapper = $("<div>")
					.addClass("tree-view-list-item-wrapper")
					.css("padding-left", 10 + 20 * level + "px")
					.append($listItemStatusIcon)
					.append($("<span>").text(itemText));

				if (
					self.options.allowSelect &&
					($subList.length === 0 || !self.options.leafSelectOnly)
				) {
					$listItemWrapper.click(function () {
						var isSelected = $listItem.hasClass("tree-view-list-item-selected");
						self.root
							.find(".tree-view-list-item")
							.removeClass("tree-view-list-item-selected");

						self.selectedItem = null;

						if (!isSelected) {
							self.selectedItem = $listItem;
							$listItem.addClass("tree-view-list-item-selected");
						}
					});
				}

				$listItem.empty().append($listItemWrapper);

				if ($subList.length > 0) {
					$listItem.append($subList);

					self._processItems($subList, level + 1);

					$listItemStatusIcon
						.empty()
						.append($("<i>").addClass("fas fa-minus mr-2"));

					$listItemWrapper
						.addClass("tree-view-list-item-parent")
						.click(function () {
							self._toggleSubList($listItem, $subList, $listItemStatusIcon);
						});

					if ($listItem.data("collapsed"))
						self._toggleSubList($listItem, $subList, $listItemStatusIcon);
				} else {
					$listItemStatusIcon
						.empty()
						.append($("<i>").addClass("fas fa-xs fa-angle-right mr-2"));
				}
			});
		},

		_toggleSubList($listItem, $subList, $listItemStatusIcon) {
			var collapsed = $subList.is(":hidden");

			$listItemStatusIcon.empty().append(
				$("<i>")
					.addClass("fas mr-2")
					.addClass(collapsed ? "fa-minus" : "fa-plus")
			);

			$subList.toggle();

      if (this.options.onItemToggle) {
        this.options.onItemToggle($listItem, $subList, !collapsed);
      }
		},

		selected: function () {
			return this.selectedItem;
		},

		addSubList: function ($listItem, $subList) {
      var self = this;
      
			if (!$subList.is("ul")) {
				console.error("specified sublist is not of type ul.");
				return;
			}

      var $listItemWrapper = $listItem.find(".tree-view-list-item-wrapper");
			var $listItemStatusIcon = $listItem.find(".tree-view-list-item-status");

			$listItemStatusIcon
				.empty()
				.append($("<i>").addClass("fas fa-minus mr-2"));

			$listItemWrapper
				.addClass("tree-view-list-item-parent")
				.click(function () {
							self._toggleSubList($listItem, $subList, $listItemStatusIcon);
				});

			var parentLevel = $listItem.data("level");

			$listItem.append($subList);
			this._processItems($subList, parentLevel + 1);
		},

		_destroy: function () {},
	});
});
