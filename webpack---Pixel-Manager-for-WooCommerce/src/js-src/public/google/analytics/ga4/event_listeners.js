/**
 * Load GA4 event listeners
 * */

// view_item_list event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#view_item_list
jQuery(document).on("wpmViewItemList", (event, product) => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            items: [wpm.ga4GetFullProductItemData(product)],
            item_list_name: wpmDataLayer.shop.list_name, // doesn't make sense on mini_cart
            item_list_id: wpmDataLayer.shop.list_id, // doesn't make sense on mini_cart
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "view_item_list", data)
            wpm.consoleLog("Google Analytics: view_item_list event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// select_item event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#select_item
jQuery(document).on("wpmSelectItem", (event, product) => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            items: [wpm.ga4GetFullProductItemData(product)],
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "select_item", data)
            wpm.consoleLog("Google Analytics: select_item event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// add_to_cart event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#add_to_cart
jQuery(document).on("wpmAddToCart", (event, product) => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            currency: wpmDataLayer.shop.currency,
            value: product.price * product.quantity,
            items: [wpm.ga4GetFullProductItemData(product)],
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "add_to_cart", data)
            wpm.consoleLog("Google Analytics: add_to_cart event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// view_item event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#view_item
jQuery(document).on("wpmViewItem", (event, product = null) => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        let data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
        }

        if (product) {
            data.currency = wpmDataLayer.shop.currency
            // data.value = 0
            data.items = [wpm.ga4GetFullProductItemData(product)]
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "view_item", data)
            wpm.consoleLog("Google Analytics: view_item event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// add_to_wishlist event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#add_to_wishlist
jQuery(document).on("wpmAddToWishlist", (event, product) => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            currency: wpmDataLayer.shop.currency,
            value: product.price * product.quantity,
            items: [wpm.ga4GetFullProductItemData(product)],
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "add_to_wishlist", data)
            wpm.consoleLog("Google Analytics: add_to_wishlist event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// remove_from_cart event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#remove_from_cart
jQuery(document).on("wpmRemoveFromCart", (event, product) => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            currency: wpmDataLayer.shop.currency,
            value: product.price * product.quantity,
            items: [wpm.ga4GetFullProductItemData(product)],
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "remove_from_cart", data)
            wpm.consoleLog("Google Analytics: remove_from_cart event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// begin_checkout event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#begin_checkout
jQuery(document).on("wpmBeginCheckout", () => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            // coupon: "",
            currency: wpmDataLayer.shop.currency,
            value: wpm.getCartValue(),
            items: wpm.getCartItemsGa4(),
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "begin_checkout", data)
            wpm.consoleLog("Google Analytics: begin_checkout event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// view_cart event
// https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#view_cart
jQuery(document).on("wpmViewCart", () => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        if (jQuery.isEmptyObject(wpmDataLayer.cart)) return

        let products = []
        let cartValue = null

        Object.values(wpmDataLayer.cart).forEach(product => {
            products.push(wpm.ga4GetFullProductItemData(product))
            cartValue = cartValue + product.quantity * product.price
        })

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            currency: wpmDataLayer.shop.currency,
            value: cartValue.toFixed(2),
            items: products,
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "view_cart", data)
            wpm.consoleLog("Google Analytics: view_cart event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// view search event
jQuery(document).on("pmwEvent:Search", () => {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .eec) return
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        let products = []

        Object.values(wpmDataLayer.products).forEach(product => {
            products.push(wpm.ga4GetFullProductItemData(product))
        })

        const data = {
            send_to: wpmDataLayer.pixels.google.analytics.ga4.measurement_id,
            search_term: wpm.getSearchTermFromUrl(),
            items: products,
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "view_search_results", data)
            wpm.consoleLog("Google Analytics: view_search_results event sent", data)
        })

    } catch (e) {
        console.error(e)
    }
})

// view order received page event
jQuery(document).on("wpmOrderReceivedPage", function() {

    try {
        if (!wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return

        // ga4_server_and_browser_tracking experiment
        // https://app.asana.com/0/1110999795232049/1204453591507565
        // ga4e: if (wpmDataLayer?.pixels?.google?.analytics?.ga4?.mp_active) {
        // 	if (wpmDataLayer?.experiments?.ga4_server_and_browser_tracking) {
        // 		break ga4e
        // 	}
        // 	return
        // }

        // Deactivated for the ga4_server_and_browser_tracking experiment
        if (wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .mp_active) return
        if (!wpm.googleConfigConditionsMet("statistics")) return

        const data = {
            send_to: [wpmDataLayer.pixels.google.analytics.ga4.measurement_id],
            transaction_id: wpmDataLayer.order.number,
            affiliation: wpmDataLayer.order.affiliation,
            currency: wpmDataLayer.order.currency,
            value: wpmDataLayer.order.value.total,
            discount: wpmDataLayer.order.discount,
            tax: wpmDataLayer.order.tax,
            shipping: wpmDataLayer.order.shipping,
            coupon: wpmDataLayer.order.coupon,
            items: wpm.getGA4OrderItems(),
        }

        wpm.gtagLoaded().then(function() {
            gtag("event", "purchase", data)
            wpm.consoleLog("Google Analytics: purchase event sent", data)
        })

        // wpm.gtagLoaded().then(function () {
        // 	gtag("get", wpmDataLayer.pixels.google.analytics.ga4.measurement_id, "client_id", (client_id) => {
        // 		console.log("transaction_id: " + wpmDataLayer.order.number + " client_id: " + client_id)
        // 	})
        // })

    } catch (e) {
        console.error(e)
    }
})