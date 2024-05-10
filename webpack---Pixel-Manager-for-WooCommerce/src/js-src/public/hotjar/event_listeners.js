/**
 * Load Hotjar event listeners
 */

// Pixel load event listener
jQuery(document).on("pmwLoadPixels", function() {

    if (wpmDataLayer ? .pixels ? .hotjar ? .site_id && !wpmDataLayer ? .pixels ? .hotjar ? .loaded) {
        if (wpm.consent.canPixelBeFired("statistics", "Hotjar") && !wpmDataLayer ? .pixels ? .hotjar ? .loaded) wpm.load_hotjar_pixel()
    }
})