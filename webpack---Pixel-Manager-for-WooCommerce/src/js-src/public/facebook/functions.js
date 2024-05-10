/**
 * Add functions for Facebook
 * */

(function(wpm, $, undefined) {

    let fbUserData

    wpm.fbeventsJsUrl = () => {

        let searchParams = new URLSearchParams(window.location.search)

        if (searchParams.has("fbevents-version")) {
            return `https://connect.facebook.net/en_US/fbevents.js?v=${searchParams.get("fbevents-version")}`
        }

        return wpmDataLayer ? .pixels ? .facebook ? .fbevents_js_url
    }

    wpm.loadFacebookPixel = () => {

        try {
            wpmDataLayer.pixels.facebook.loaded = true

                // @formatter:off
                ! function(f, b, e, v, n, t, s) {
                    if (f.fbq) return;
                    n = f.fbq = function() {
                        n.callMethod ?
                            n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                    };
                    if (!f._fbq) f._fbq = n;
                    n.push = n;
                    n.loaded = !0;
                    n.version = '2.0';
                    n.queue = [];
                    t = b.createElement(e);
                    t.async = !0;
                    t.src = v;
                    s = b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t, s)
                }(window, document, 'script',
                    wpm.fbeventsJsUrl());
            // @formatter:on

            let data = {}

            // Add user identifiers to data,
            // and only if fbp was set
            if (wpm.isFbpSet() && wpm.isFbAdvancedMatchingEnabled()) {
                data = { ...wpm.getUserIdentifiersForFb()
                }
            }

            // https://developers.facebook.com/docs/meta-pixel/advanced/#automatic-configuration
            // fbq("set", "autoConfig", false, wpmDataLayer.pixels.facebook.pixel_id)

            // Initialize the Facebook Pixel and send the first PageView event
            fbq("init", wpmDataLayer.pixels.facebook.pixel_id, data)

            if (wpmDataLayer ? .pixels ? .facebook ? .mobile_bridge_app_id) {
                fbq("set", "mobileBridge", wpmDataLayer.pixels.facebook.pixel_id, wpmDataLayer ? .pixels ? .facebook ? .mobile_bridge_app_id)
            }

            fbq("track", "PageView")

        } catch (e) {
            console.error(e)
        }
    }

    // https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching
    wpm.getUserIdentifiersForFb = () => {

        let data = {}

        // external ID
        if (wpmDataLayer ? .user ? .id ? .raw) data.external_id = wpmDataLayer.user.id.raw
        if (wpmDataLayer ? .order ? .user_id) data.external_id = wpmDataLayer.order.user_id

        // email
        if (wpmDataLayer ? .user ? .email ? .facebook) data.em = wpmDataLayer.user.email.facebook
        if (wpmDataLayer ? .order ? .billing_email_hashed) data.em = wpmDataLayer.order.billing_email_hashed

        // first name
        if (wpmDataLayer ? .user ? .first_name ? .facebook) data.fn = wpmDataLayer.user.first_name.facebook
        if (wpmDataLayer ? .order ? .billing_first_name) data.fn = wpmDataLayer.order.billing_first_name.toLowerCase()

        // last name
        if (wpmDataLayer ? .user ? .last_name ? .facebook) data.ln = wpmDataLayer.user.last_name.facebook
        if (wpmDataLayer ? .order ? .billing_last_name) data.ln = wpmDataLayer.order.billing_last_name.toLowerCase()

        // phone
        if (wpmDataLayer ? .user ? .phone ? .facebook) data.ph = wpmDataLayer.user.phone.facebook
        if (wpmDataLayer ? .order ? .billing_phone) data.ph = wpmDataLayer.order.billing_phone.replace("+", "")

        // city
        if (wpmDataLayer ? .user ? .city ? .facebook) data.ct = wpmDataLayer.user.city.facebook
        if (wpmDataLayer ? .order ? .billing_city) data.ct = wpmDataLayer.order.billing_city.toLowerCase().replace(/ /g, "")

        // state
        if (wpmDataLayer ? .user ? .state ? .facebook) data.st = wpmDataLayer.user.state.facebook
        if (wpmDataLayer ? .order ? .billing_state) data.st = wpmDataLayer.order.billing_state.toLowerCase().replace(/[a-zA-Z]{2}-/, "")

        // postcode
        if (wpmDataLayer ? .user ? .postcode ? .facebook) data.zp = wpmDataLayer.user.postcode.facebook
        if (wpmDataLayer ? .order ? .billing_postcode) data.zp = wpmDataLayer.order.billing_postcode

        // country
        if (wpmDataLayer ? .user ? .country ? .facebook) data.country = wpmDataLayer.user.country.facebook
        if (wpmDataLayer ? .order ? .billing_country) data.country = wpmDataLayer.order.billing_country.toLowerCase()

        return data
    }

    wpm.getFbRandomEventId = () => (Math.random() + 1).toString(36).substring(2)

    wpm.getFbUserData = () => {

        /**
         * We need to cache the FB user data for InitiateCheckout
         * where getting the user data from the browser is too slow
         * using wpm.getCookie().
         *
         * And we need the object merge because the ViewContent hit happens too fast
         * after adding a variation to the cart because the function to cache
         * the user data is too slow.
         *
         * But we can get the user_data using wpm.getCookie()
         * because we don't move away from the page and can wait for the browser
         * to get it.
         *
         * Also, the merge ensures that new data will be added to fbUserData if new
         * data is being added later, like user ID, or fbc.
         */

        fbUserData = { ...fbUserData,
            ...wpm.getFbUserDataFromBrowser()
        }

        return fbUserData
    }

    wpm.isFbAdvancedMatchingEnabled = () => {
        if (wpmDataLayer ? .pixels ? .facebook ? .advanced_matching) {
            return true
        }

        return false
    }

    wpm.setFbUserData = () => {
        fbUserData = wpm.getFbUserDataFromBrowser()
    }

    wpm.getFbUserDataFromBrowser = () => {

        let
            data = {}

        if (wpm.getCookie("_fbp") && wpm.isValidFbp(wpm.getCookie("_fbp"))) {
            data.fbp = wpm.getCookie("_fbp")
        }

        if (wpm.getCookie("_fbc") && wpm.isValidFbc(wpm.getCookie("_fbc"))) {
            data.fbc = wpm.getCookie("_fbc")
        }

        if (wpm.isFbAdvancedMatchingEnabled()) {
            if (wpmDataLayer ? .user ? .id ? .raw) data.external_id = wpmDataLayer.user.id.raw
        }

        if (navigator.userAgent) data.client_user_agent = navigator.userAgent

        // If a IPv6 address is available in the data store, add it to the user data
        if (wpm.retrieveData("ipv6")) data.client_ip_address = wpm.retrieveData("ipv6")

        return data
    }

    wpm.isFbpSet = () => {
        return !!wpm.getCookie("_fbp")
    }

    // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/
    wpm.isValidFbp = fbp => {

        let re = new RegExp(/^fb\.[0-2]\.\d{13}\.\d{8,20}$/)

        return re.test(fbp)
    }

    // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/
    wpm.isValidFbc = fbc => {

        let re = new RegExp(/^fb\.[0-2]\.\d{13}\.[\da-zA-Z_-]{8,}/)

        return re.test(fbc)
    }

    // wpm.fbViewContent = (product = null) => {
    //
    // 	try {
    // 		if (!wpmDataLayer?.pixels?.facebook?.loaded) return
    //
    // 		let eventId = wpm.getFbRandomEventId()
    //
    // 		let data = {}
    //
    // 		if (product) {
    // 			data.content_type = "product"
    // 			data.content_name = product.name
    // 			// data.content_category = product.category
    // 			data.content_ids  = product.dyn_r_ids[wpmDataLayer.pixels.facebook.dynamic_remarketing.id_type]
    // 			data.currency     = wpmDataLayer.shop.currency
    // 			data.value        = product.price
    // 		}
    //
    // 		fbq("track", "ViewContent", data, {
    // 			eventID: eventId,
    // 		})
    //
    // 		let capiData = {
    // 			event_name      : "ViewContent",
    // 			event_id        : eventId,
    // 			user_data       : wpm.getFbUserData(),
    // 			event_source_url: window.location.href,
    // 		}
    //
    // 		if (product) {
    // 			product["currency"]  = wpmDataLayer.shop.currency
    // 			capiData.custom_data = wpm.fbGetProductDataForCapiEvent(product)
    // 		}
    //
    // 		jQuery(document).trigger("wpmFbCapiEvent", capiData)
    // 	} catch (e) {
    // 		console.error(e)
    // 	}
    // }

    wpm.fbGetProductDataForCapiEvent = product => {
        return {
            content_type: "product",
            content_name: product.name,
            content_ids: [
                product.dyn_r_ids[wpmDataLayer.pixels.facebook.dynamic_remarketing.id_type],
            ],
            value: parseFloat(product.quantity * product.price),
            currency: product.currency,
        }
    }

    wpm.facebookContentIds = () => {
        let prodIds = []

        Object.values(wpmDataLayer.order.items).forEach(item => {
            if (wpmDataLayer ? .shop ? .variations_output && 0 !== item.variation_id) {
                prodIds.push(String(wpmDataLayer.products[item.variation_id].dyn_r_ids[wpmDataLayer.pixels.facebook.dynamic_remarketing.id_type]))
            } else {
                prodIds.push(String(wpmDataLayer.products[item.id].dyn_r_ids[wpmDataLayer.pixels.facebook.dynamic_remarketing.id_type]))
            }
        })

        return prodIds
    }

    wpm.trackCustomFacebookEvent = (eventName, customData = {}) => {
        try {
            if (!wpmDataLayer ? .pixels ? .facebook ? .loaded) return

            let eventId = wpm.getFbRandomEventId()

            fbq("trackCustom", eventName, customData, {
                eventID: eventId,
            })

            jQuery(document).trigger("wpmFbCapiEvent", {
                event_name: eventName,
                event_id: eventId,
                user_data: wpm.getFbUserData(),
                event_source_url: window.location.href,
                custom_data: customData,
            })
        } catch (e) {
            console.error(e)
        }
    }

    wpm.fbGetContentIdsFromCart = () => {

        let content_ids = []

        for (const key in wpmDataLayer.cart) {
            content_ids.push(wpmDataLayer.products[key].dyn_r_ids[wpmDataLayer.pixels.facebook.dynamic_remarketing.id_type])
        }

        return content_ids
    }

}(window.wpm = window.wpm || {}, jQuery));