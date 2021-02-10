$(function () {
	$.widget("custom.treeView", {
		options: {},

		_create: function () {
			this.root = this.element;

			this._build();
		},

		_build: function () {
			this.root.addClass("tree-view-list");
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

        var $listItemStatusIcon = $("<span>");

				var $listItemWrapper = $("<div>")
					.css("padding-left", 10 + 20 * level + "px")
          .append($listItemStatusIcon)
					.append($("<span>").text(itemText));

				$listItem.empty().append($listItemWrapper);

				if ($subList.length > 0) {
					$listItem.append($subList);

					self._processItems($subList, level + 1);

          $listItemStatusIcon.empty().append($("<i>").addClass("fas fa-minus mr-2"));

					$listItemWrapper
						.addClass("tree-view-list-item-parent")

						.click(function () {
              var collapsed = $subList.is(":hidden");

              $listItemStatusIcon.empty().append($("<i>").addClass("fas mr-2").addClass(collapsed ? "fa-minus" : "fa-plus"));

              $subList.toggle();
						});
				} else {
          $listItemStatusIcon.empty().append($("<i>").addClass("far fa-xs fa-angle-right mr-2"));
				}
			});
		},

		_destroy: function () {},
	});
});
