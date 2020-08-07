$(function () {

    var getToast = function (title, icon, message, delay) {

        var autoHide = delay > 0;

        if (!delay)
            delay = 3000;

        return $("<div>")
            .addClass("toast")
            .attr("role", "alert") //status
            .attr("aria-live", "assertive") //polite
            .attr("aria-atomic", "true")
            .attr("data-delay", delay)
            .attr("data-autohide", autoHide)
            .append($("<div>")
                .addClass("toast-header d-flex justify-content-between")
                .append($("<strong>")
                    .text(title)
                    .prepend($("<i>")
                        .addClass(icon)))
                .append($("<button>")
                    .addClass("ml-2 mb-1 close")
                    .attr("data-dismiss", "toast")
                    .attr("aria-label", "Close")
                    .append($("<span>")
                        .attr("aria-hidden", "true")
                        .html("&times;"))))
            .append($("<div>")
                .addClass("toast-body")
                .text(message))
            .appendTo($("#toast-wrapper"))
            .toast("show");
    }

    window.toastSuccess = function (message, delay) {
        var $toast = getToast("Success", "fas fa-check-circle mr-2", message, delay);
        $toast.addClass("toast-success");
    };

    window.toastError = function (message, delay) {
        var $toast = getToast("Error", "fas fa-exclamation-circle mr-2", message, delay);
        $toast.addClass("toast-error");
    };

    window.toastWarning = function (message, delay) {
        var $toast = getToast("Warning", "fas fa-exclamation-triangle mr-2", message, delay);
        $toast.addClass("toast-warning");
    };

    window.toastInfo = function (message, delay) {
        var $toast = getToast("Info", "fas fa-info-circle mr-2", message, delay);
        $toast.addClass("toast-info");
    };

});