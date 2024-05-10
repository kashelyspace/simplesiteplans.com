/**
 * All event listeners
 *
 * https://developers.facebook.com/docs/meta-pixel/reference
 * */

// Load pixel event
jQuery(document).on("pmwLoadPixels", () => {

    if (
        wpmDataLayer ? .pixels ? .facebook ? .pixel_id &&
        !wpmDataLayer ? .pixels ? .facebook ? .loaded &&
        !wpm.doesUrlContainPatterns(wpmDataLayer ? .pixels ? .facebook ? .exclusion_patterns)
    ) {
        if (wpm.consent.canPixelBeFired("marketing", "Facebook")) wpm.loadFacebookPixel()
    }
})

// AddToCart event
// https://developers.facebook.com/docs/meta-pixel/reference
jQuery(document).on("wpmClientSideAddToCart", (event, payload) => {

    try {
        if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

        fbq("track", "AddToCart", payload.facebook.custom_data, {
            eventID: payload.facebook.event_id,
        })
        wpm.consoleLog("Facebook Pixel: AddToCart event sent", payload.facebook)

    } catch (error) {
        console.error(error)
    }
})

// InitiateCheckout event
// https://developers.facebook.com/docs/meta-pixel/reference
jQuery(document).on("wpmClientSideBeginCheckout", (event, payload) => {

    try {
        if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

        fbq("track", "InitiateCheckout", payload.facebook.custom_data, {
            eventID: payload.facebook.event_id,
        })
        wpm.consoleLog("Facebook Pixel: InitiateCheckout event sent", payload.facebook)

    } catch (error) {
        console.error(error)
    }
})

// AddToWishlist event
// https://developers.facebook.com/docs/meta-pixel/reference
jQuery(document).on("wpmClientSideAddToWishlist", (event, payload) => {

    try {
        if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

        fbq("track", "AddToWishlist", payload.facebook.custom_data, {
            eventID: payload.facebook.event_id,
        })
        wpm.consoleLog("Facebook Pixel: AddToWishlist event sent", payload.facebook)

    } catch (error) {
        console.error(error)
    }
})

// ViewContent event
// https://developers.facebook.com/docs/meta-pixel/reference
jQuery(document).on("wpmClientSideViewItem", (event, payload) => {

    try {
        if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

        fbq("track", "ViewContent", payload.facebook.custom_data, {
            eventID: payload.facebook.event_id,
        })
        wpm.consoleLog("Facebook Pixel: ViewContent event sent", payload.facebook)

    } catch (error) {
        console.error(error)
    }
})


// view search event
// https://developers.facebook.com/docs/meta-pixel/reference
jQuery(document).on("wpmClientSideSearch", (event, payload) => {

    try {
        if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

        fbq("track", "Search", payload.facebook.custom_data, {
            eventID: payload.facebook.event_id,
        })
        wpm.consoleLog("Facebook Pixel: Search event sent", payload.facebook)

    } catch (error) {
        console.error(error)
    }
})

// load always event
jQuery(document).on("wpmLoadAlways", () => {

    try {
        if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

        wpm.setFbUserData()
    } catch (error) {
        console.error(error)
    }
})

// view order received page event
// https://developers.facebook.com/docs/meta-pixel/reference
jQuery(document).on("wpmClientSideOrderReceivedPage", (event, payload) => {

    try {
        if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

        fbq("track", "Purchase", payload.facebook.custom_data, {
            eventID: payload.facebook.event_id,
        })
        wpm.consoleLog("Facebook Pixel: Purchase event sent", payload.facebook)

    } catch (error) {
        console.error(error)
    }
})