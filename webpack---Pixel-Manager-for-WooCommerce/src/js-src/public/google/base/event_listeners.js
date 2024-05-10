/**
 * Load Google base event listeners
 */

// Pixel load event listener
jQuery(document).on("pmwLoadPixels", function() {

    if (typeof wpmDataLayer ? .pixels ? .google ? .state === "undefined") {
        if (wpm.googleConfigConditionsMet()) {
            // console.log("Google Analytics / Google Ads loaded")
            wpm.loadGoogle()
        } else {
            wpm.consent.logSuppressedPixel("statistics", "Google Analytics / Google Ads")
        }
    }
})