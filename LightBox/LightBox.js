$.widget("custom.lightBox",
    {
        options: {
            currentIndex: null,
            images: [],

            getRelativeSource: null,
        },

        _create: function () {

            // Reassignment of the current element to make references more readable
            this.$lightBox = this.element;

            // Build the light box
            this._build();

            // Setup the button and keyboard behavior
            this._setupMouseEvents();
            this._setupKeyboardEvents();

            // Set the current index. If specified in the options, use that index otherwise initialize with 0
            this.currentIndex = this.options.currentIndex || 0;

            // Based on the options, load the current image from the options or from an external callback
            this.setSource(this._loadSource(this.currentIndex));

            // By default, hide the buttons
            this._toggleButtons(false);
        },

        _build: function () {
            // Assignment of self for use in callbacks
            var self = this;

            // Create the backdrop and add before the lightbox
            this.$backdrop = $("<div>")
                .addClass("light-box-backdrop")
                .insertBefore(this.element);

            // Create a loading indication to be shown whenever an image is loading
            this.$imageLoader = $("<span>")
                .addClass("light-box-image-loader")
                .append($("<i>")
                .addClass("fas fa-spinner fa-pulse"))
            
            // Create an error indication in case an image cannot be loaded
            this.$errorInfo = $("<div>")
            .addClass("light-box-error-info")
            .append($("<i>").addClass("fas fa-times-circle text-danger"))
            .append($("<span>").addClass("mt-3").text("Could not load image"))
            .hide();

            // Save a reference to the image tag to be able to update the source later
            this.$currentImage = $("<img>");

            // Build the close button
            this.$closeButton = $("<button>")
                .addClass("light-box-icon-button light-box-close-button")
                .append($("<i>").addClass("fas fa-times"));

            // Build the left button
            this.$leftButton = $("<button>")
                .addClass("light-box-icon-button light-box-left-button")
                .append($("<i>").addClass("fas fa-angle-left"));

            // Build the right button
            this.$rightButton = $("<button>")
                .addClass("light-box-icon-button light-box-right-button")
                .append($("<i>").addClass("fas fa-angle-right"));

            // Build the wrapper
            this.$lightBoxWrapper = $("<div>")
                .addClass("light-box-wrapper")
                .append(this.$imageLoader)
                .append(this.$errorInfo)
                .append(this.$closeButton)
                .append(this.$leftButton)
                .append(this.$rightButton)
                .append(this.$currentImage);

            // Prepare the light box
            this.$lightBox
                .addClass("light-box")
                .append(this.$lightBoxWrapper);
        },

        _setupMouseEvents: function () {
            // Assignment of self for use in callbacks
            const self = this;

            // On hover of the image, show the buttons
            this.$lightBoxWrapper.mouseenter(function() {
                self._toggleButtons(true);
            });

            // On exiting the image, hide the buttons
            this.$lightBoxWrapper.mouseleave(function() {
                self._toggleButtons(false);
            });

            // On close button click, destroy the lightbox
            this.$closeButton.click(function () {
                self._destroy();
            });
            
            // On click outside of the image array, destroy the lightbox
            this.$lightBox.click(function (event) {
                const $target = $(event.target);

                // Do not destroy the light box if there is no error and if clicked inside of the image area
                if($target.parents(".light-box-error").length == 0 && $target.parents(".light-box-wrapper").length > 0) return;

                self._destroy();
            });

            // On left button click, load the previous image
            this.$leftButton.click(function () {
                self.loadPrevious();
            });

            // On right button click, load the next image
            this.$rightButton.click(function () {
                self.loadNext();
            });

            // On load of the current image, show it and remove the loading indication
            this.$currentImage.on("load", function () {
                self.$currentImage.show();
                self.$imageLoader.hide();
                self.$lightBox.removeClass("light-box-loading");
            })

            // If the image cannot load, hide the loader and the image and show the error indictation
            this.$currentImage.on("error", function () {
                self.$imageLoader.hide();
                self.$currentImage.hide();
                self.$errorInfo.show();
                self.$lightBox.addClass("light-box-error");
            });
        },

        _setupKeyboardEvents: function () {

            // Assignment of self for use in callbacks
            const self = this;

            // Save the key up handler to be able to remove it from the document again
            this.documentKeyHandler = function (event)  {
                switch(event.key) {
                    case "Left":
                    case "ArrowLeft":
                        self.loadPrevious();
                        break;
                    
                    case "Right":
                    case "ArrowRight":
                        self.loadNext();
                        break;

                    case "Esc":
                    case "Escape":
                        self._destroy();
                        break;

                    default:
                        return;
                }   
            }

            // Assign the key up handler to the document
            $(document).on("keyup", this.documentKeyHandler);
        },

        _toggleButtons: function(show) {

            // Toggle all buttons within the container
            this.$closeButton.toggle(show);
            this.$leftButton.toggle(show);
            this.$rightButton.toggle(show);
        },

        _loadImageSource: function(index) {
            // Reference the images from the options
            const images = this.options.images;

            // If there are no images, show an error
            if(images.length == 0)
            {
                setSource("");
                return;
            }

            // If the specified index is out of bounds, return an empty string
            if(index < 0 || index >= images.length) {
                return;
            }

            // Otherwise load the source at the specified index and replace the current index
            this.setSource(images[index]);
            this.currentIndex = index;
        },

        _loadRelativeSource: function(index) {
            // If the relative source is not set, return false
            if(!this.options.getRelativeSource) {
                return false;
            }
        
            // Retrieve the new index and source from the getRelativeSource callback
            [newIndex, newSource, isFirst, isLast] = this.options.getRelativeSource(index);

            // If the index is <= zero, hide the left (previous) button
            this.$leftButton.toggleClass("light-box-icon-button-hidden", isFirst);

            // If the index is at the end or beyond of the images array, hide the right (next) button
            this.$rightButton.toggleClass("light-box-icon-button-hidden", isLast);

            // If the index has changed, set the new source
            this.setSource(newSource);
            this.currentIndex = newIndex;

            // Return true to indicate a relative source was indeed loaded
            return true;
        },

        _loadSource: function(index) {

            // If the relative source is defined, load it
            if(this._loadRelativeSource(index)) {
                return;
            }

            // If the index is <= zero, hide the left (previous) button
            this.$leftButton.toggleClass("light-box-icon-button-hidden", index <= 0);
            
            // If the index is at the end or beyond of the images array, hide the right (next) button
            this.$rightButton.toggleClass("light-box-icon-button-hidden", index >= this.options.images.length - 1);

            // Set the source to the source at the new index
            this._loadImageSource(index);
        },

        // Change the source of the image and 
        setSource: function (source) {
            this.$imageLoader.show();
            this.$errorInfo.hide();
            this.$currentImage.hide();
            this.$currentImage.attr("src", source);

            this.$lightBox
                .addClass("light-box-loading")
                .removeClass("light-box-error");
        },

        // Load the next image
        loadNext: function () {

            // If the right button is not shown, we are at the end of the list
            if(this.$rightButton.hasClass("light-box-icon-button-hidden")) {
                return;
            }
            
            // Otherwise load the source of the next image
            this._loadSource(this.currentIndex + 1);
        },

        // Load the previous image
        loadPrevious: function () {

            // If the left button is not shown, we are at the beginning of the list
            if(this.$leftButton.hasClass("light-box-icon-button-hidden")) {
                return;
            }

            // Otherwise load the source of the previous image
            this._loadSource(this.currentIndex - 1);
        },

        _destroy: function () {
            // Remove the lightbox and the backdrop
            this.$backdrop.remove();
            this.$lightBox.remove();

            // Remove the keybaord handlers
            $(document).off("keyup", this.documentKeyHandler);
        }
    });