/**
 * Load Google Ads event listeners
 * */

// view_item_list event
jQuery(document).on("wpmViewItemList", (event, product) => {

    try {
        if (jQuery.isEmptyObject(wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds)) return
        if (!wpmDataLayer ? .pixels ? .google ? .ads ? .dynamic_remarketing ? .status) return
        if (!wpm.googleConfigConditionsMet("marketing")) return


        if (
            wpmDataLayer ? .shop ? .variations_output &&
            product.is_variable &&
            wpmDataLayer.pixels.google.ads.dynamic_remarketing.send_events_with_parent_ids === false
        ) return

        // try to prevent that WC sends cached hits to Google
        if (!product) return

        let data = {
            send_to: wpm.getGoogleAdsConversionIdentifiers(),
            items: [{
                id: product.dyn_r_ids[wpmDataLayer.pixels.google.ads.dynamic_remarketing.id_type],
                google_business_vertical: wpmDataLayer.pixels.google.ads.google_business_vertical,
            }],
        }

        if (wpmDataLayer ? .user ? .id ? .raw) {
            data.user_id = wpmDataLayer.user.id.raw
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "view_item_list", data)
            wpm.consoleLog("Google Ads: view_item_list event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// add_to_cart event
jQuery(document).on("wpmAddToCart", (event, product) => {

    try {
        if (jQuery.isEmptyObject(wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds)) return
        if (!wpmDataLayer ? .pixels ? .google ? .ads ? .dynamic_remarketing ? .status) return
        if (!wpm.googleConfigConditionsMet("marketing")) return

        let data = {
            send_to: wpm.getGoogleAdsConversionIdentifiers(),
            value: product.quantity * product.price,
            items: [{
                id: product.dyn_r_ids[wpmDataLayer.pixels.google.ads.dynamic_remarketing.id_type],
                quantity: product.quantity,
                price: product.price,
                google_business_vertical: wpmDataLayer.pixels.google.ads.google_business_vertical,
            }],
        }

        if (wpmDataLayer ? .user ? .id ? .raw) {
            data.user_id = wpmDataLayer.user.id.raw
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "add_to_cart", data)
            wpm.consoleLog("Google Ads: add_to_cart event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

// view_item event
jQuery(document).on("wpmViewItem", (event, product = null) => {

    try {
        if (jQuery.isEmptyObject(wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds)) return
        if (!wpmDataLayer ? .pixels ? .google ? .ads ? .dynamic_remarketing ? .status) return
        if (!wpm.googleConfigConditionsMet("marketing")) return

        let data = {
            send_to: wpm.getGoogleAdsConversionIdentifiers(),
        }

        if (product) {
            data.value = (product.quantity ? product.quantity : 1) * product.price
            data.items = [{
                id: product.dyn_r_ids[wpmDataLayer.pixels.google.ads.dynamic_remarketing.id_type],
                quantity: (product.quantity ? product.quantity : 1),
                price: product.price,
                google_business_vertical: wpmDataLayer.pixels.google.ads.google_business_vertical,
            }]
        }

        if (wpmDataLayer ? .user ? .id ? .raw) {
            data.user_id = wpmDataLayer.user.id.raw
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "view_item", data)
            wpm.consoleLog("Google Ads: view_item event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})


// view search event
jQuery(document).on("pmwEvent:Search", () => {

    try {
        if (jQuery.isEmptyObject(wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds)) return
        if (!wpmDataLayer ? .pixels ? .google ? .ads ? .dynamic_remarketing ? .status) return
        if (!wpm.googleConfigConditionsMet("marketing")) return


        let products = []

        Object.values(wpmDataLayer.products).forEach(product => {

            if (
                wpmDataLayer ? .shop ? .variations_output &&
                product.is_variable &&
                wpmDataLayer.pixels.google.ads.dynamic_remarketing.send_events_with_parent_ids === false
            ) return

            products.push({
                id: product.dyn_r_ids[wpmDataLayer.pixels.google.ads.dynamic_remarketing.id_type],
                google_business_vertical: wpmDataLayer.pixels.google.ads.google_business_vertical,
            })
        })

        // console.log(products);

        let data = {
            send_to: wpm.getGoogleAdsConversionIdentifiers(),
            // value  : 1 * product.price,
            items: products,
        }

        if (wpmDataLayer ? .user ? .id ? .raw) {
            data.user_id = wpmDataLayer.user.id.raw
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "view_search_results", data)
            wpm.consoleLog("Google Ads: view_search_results event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})


// user log in event
jQuery(document).on("wpmLogin", () => {

    try {
        if (jQuery.isEmptyObject(wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds)) return
        if (!wpmDataLayer ? .pixels ? .google ? .ads ? .dynamic_remarketing ? .status) return
        if (!wpm.googleConfigConditionsMet("marketing")) return

        let data = {
            send_to: wpm.getGoogleAdsConversionIdentifiers(),
        }

        if (wpmDataLayer ? .user ? .id ? .raw) {
            data.user_id = wpmDataLayer.user.id.raw
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "login", data)
            wpm.consoleLog("Google Ads: login event sent", data)
        })
    } catch (e) {
        console.error(e)
    }
})

/**
 * Google Ads remarketing purchase
 *
 * https://support.google.com/google-ads/answer/7305793
 */
jQuery(document).on("wpmOrderReceivedPage", () => {

    try {
        if (jQuery.isEmptyObject(wpm.getGoogleAdsConversionIdentifiersWithLabel())) return
        if (!wpm.googleConfigConditionsMet("marketing")) return

        let data = {
            send_to: wpm.getGoogleAdsConversionIdentifiers(),
            value: wpmDataLayer.order.value.marketing,
            // currency: wpmDataLayer.order.currency,
            items: wpm.getGoogleAdsRegularOrderItems(),
        }

        wpm.gtagLoaded().then(() => {
            gtag("event", "purchase", data)
            wpm.consoleLog("Google Ads: purchase event sent (for remarketing lists)", data)
        })

    } catch (e) {
        console.error(e)
    }
})

/**
 * Google Ads conversion event
 *
 * new_customer parameter: https://support.google.com/google-ads/answer/9917012
 * cart data: https://support.google.com/google-ads/answer/9028614
 * customer_lifetime_value is undocumented, but available in gtag.js
 */
jQuery(document).on("wpmOrderReceivedPage", () => {

    try {
        if (jQuery.isEmptyObject(wpm.getGoogleAdsConversionIdentifiersWithLabel())) return
        if (!wpm.googleConfigConditionsMet("marketing")) return

        let data = {
            send_to: wpm.getGoogleAdsConversionIdentifiersWithLabel(),
            transaction_id: wpmDataLayer.order.number,
            value: wpmDataLayer.order.value.marketing,
            currency: wpmDataLayer.order.currency,
            new_customer: wpmDataLayer.order.new_customer,
        }

        if (wpmDataLayer ? .order ? .value ? .ltv ? .marketing) {
            data.customer_lifetime_value = wpmDataLayer.order.value.ltv.marketing
        }

        if (wpmDataLayer ? .user ? .id ? .raw) {
            data.user_id = wpmDataLayer.user.id.raw
        }

        // https://support.google.com/google-ads/answer/9028614
        if (wpmDataLayer ? .order ? .aw_merchant_id) {
            data.discount = wpmDataLayer.order.discount
            data.aw_merchant_id = wpmDataLayer.order.aw_merchant_id
            data.aw_feed_country = wpmDataLayer.order.aw_feed_country
            data.aw_feed_language = wpmDataLayer.order.aw_feed_language
            data.items = wpm.getGoogleAdsRegularOrderItems()
        }

        wpm.gtagLoaded().then(() => {
            // Event needs to be "purchase" (not "conversion") in order to be able to track cart data:
            // https://support.google.com/google-ads/answer/9028614
            gtag("event", "purchase", data)
            wpm.consoleLog("Google Ads: conversion event sent", data)
        })

    } catch (e) {
        console.error(e)
    }
})