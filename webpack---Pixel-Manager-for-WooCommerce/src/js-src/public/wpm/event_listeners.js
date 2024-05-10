/**
 * remove_from_cart event
 *
 * Cannot be attached directly because the mini cart doesn't necessarily contain the remove button on page load.
 */
jQuery(document).on("click", ".remove_from_cart_button, .remove", (event) => {

    // console.log("remove_from_cart event" + new Date().getTime())

    try {

        let url = new URL(jQuery(event.currentTarget).attr("href"))
        let productId = wpm.getProductIdByCartItemKeyUrl(url)

        wpm.removeProductFromCart(productId)

    } catch (e) {
        console.error(e)
    }
})


/**
 * begin_checkout event
 *
 * Cannot be attached directly because the mini cart doesn't necessarily contain the remove button on page load.
 */
let checkoutButtonClasses = [
    // ".checkout", // this is too generic. It triggers on the checkout page on some themes fore each interaction with the checkout form.
    ".checkout-button",
    ".cart-checkout-button",
    ".button.checkout",
    ".xoo-wsc-ft-btn-checkout", // https://xootix.com/side-cart-for-woocommerce/
    ".elementor-button--checkout",
    ".xt_woofc-checkout", // https://wordpress.org/plugins/woo-floating-cart-lite/
    ".fkcart-checkout--text", // https://funnelkit.com/
]

const checkoutButtonSelectors = wpm.prepareSelectors(checkoutButtonClasses, "beginCheckout")

// https://wordpress.stackexchange.com/a/352171/68337
jQuery(document).on("click init_checkout", checkoutButtonSelectors, () => {

    jQuery(document).trigger("wpmBeginCheckout")
})

jQuery(document).on("updated_cart_totals", () => {
    jQuery(document).trigger("wpmViewCart")
})

/**
 * Set up PWM events
 */

// track checkout option event: purchase click
// https://wordpress.stackexchange.com/a/352171/68337
jQuery(document).on("wpmLoad", (event) => {
    jQuery(document).on("payment_method_selected", () => {

        if (false === wpm.paymentMethodSelected) {
            wpm.fireCheckoutProgress(3)
        }

        wpm.fireCheckoutOption(3, jQuery("input[name='payment_method']:checked").val())
        wpm.paymentMethodSelected = true
    })
})

// populate the wpmDataLayer with the cart items
jQuery(document).on("wpmLoad", () => {

    try {
        wpm.initCart()
    } catch (e) {
        console.error(e)
    }
})

// get all add-to-cart= products from backend
jQuery(document).on("wpmLoad", () => {

    wpmDataLayer.products = wpmDataLayer.products || {}

    // scan page for add-to-cart= links
    let productIds = wpm.getAddToCartLinkProductIds()

    wpm.getProductsFromBackend(productIds)
})

/**
 * Save the referrer into a cookie
 */

jQuery(document).on("wpmLoad", () => {

    // If the referrer is already stored, then return
    if (wpm.retrieveData("referrer")) {
        return
    }

    if (document.referrer) {
        let referrerUrl = new URL(document.referrer)
        let referrerHostname = referrerUrl.hostname

        if (referrerHostname !== window.location.host) {
            wpm.storeData("referrer", referrerHostname)
        }
    }
})


/**
 * Create our own load event in order to better handle script flow execution when JS "optimizers" shuffle the code.
 */
jQuery(document).on("wpmLoad", () => {
    // document.addEventListener("wpmLoad", function () {
    try {
        if (typeof wpmDataLayer != "undefined" && !wpmDataLayer ? .pmw_loaded) {

            jQuery(document).trigger("wpmLoadAlways")

            if (wpmDataLayer ? .shop) {
                if (
                    "product" === wpmDataLayer.shop.page_type &&
                    "variable" !== wpmDataLayer.shop.product_type &&
                    wpm.getMainProductIdFromProductPage()
                ) {
                    let product = wpm.getProductDataForViewItemEvent(wpm.getMainProductIdFromProductPage())
                    jQuery(document).trigger("wpmViewItem", product)
                } else if ("product_category" === wpmDataLayer.shop.page_type) {
                    jQuery(document).trigger("wpmCategory")
                } else if ("search" === wpmDataLayer.shop.page_type) {
                    jQuery(document).trigger("pmwEvent:Search")
                } else if ("cart" === wpmDataLayer.shop.page_type) {
                    jQuery(document).trigger("wpmViewCart")
                } else if ("order_received_page" === wpmDataLayer.shop.page_type) {
                    if (wpmDataLayer ? .order && !wpm.isOrderIdStored(wpmDataLayer.order.id)) {
                        jQuery(document).trigger("wpmOrderReceivedPage")
                        wpm.writeOrderIdToStorage(wpmDataLayer.order.id, wpmDataLayer.order.key)
                        if (typeof wpm.acrRemoveCookie === "function") wpm.acrRemoveCookie()
                    }
                } else {
                    jQuery(document).trigger("wpmEverywhereElse")
                }
            } else {
                jQuery(document).trigger("wpmEverywhereElse")
            }

            if (wpmDataLayer ? .user ? .id && !wpm.hasLoginEventFired()) {
                jQuery(document).trigger("wpmLogin")
                wpm.setLoginEventFired()
            }

            wpmDataLayer.pmw_loaded = true
        }

    } catch (e) {
        console.error(e)
    }
})

jQuery(document).on("wpmLoad", async () => {
    if (wpm.retrieveData("restEndpointAvailable") === false) wpm.consoleError("REST endpoint is not available. Using admin-ajax.php instead.")
})

/**
 * All ecommerce events
 */

/**
 * Add to cart event
 */
jQuery(document).on("wpmAddToCart", (event, product) => {

    wpm.consoleLog("wpmAddToCart event fired", {
        event,
        product
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "addToCart",
        product: product,
    }

    // Facebook
    // If Facebook pixel is loaded, add Facebook server to server event data to the payload
    if (wpmDataLayer ? .pixels ? .facebook ? .loaded) {
        payload.facebook = {
            event_name: "AddToCart",
            event_id: wpm.getFbRandomEventId(),
            user_data: wpm.getFbUserData(),
            event_source_url: window.location.href,
            custom_data: wpm.fbGetProductDataForCapiEvent(product),
        }
    }

    // Pinterest
    // https://developers.pinterest.com/docs/conversions/best/
    // https://developers.pinterest.com/docs/api/v5/#operation/events/create
    // https://developers.pinterest.com/docs/conversions/event/
    if (wpmDataLayer ? .pixels ? .pinterest ? .loaded) {

        payload.pinterest = wpm.getPinterestS2SBaseData()

        payload.pinterest.event_name = "addtocart"
        payload.pinterest.custom_data = wpm.pinterestGetProductDataForCapiEvent(product)
    }

    // TikTok
    // https://ads.tiktok.com/gateway/docs/index?identify_key=c0138ffadd90a955c1f0670a56fe348d1d40680b3c89461e09f78ed26785164b&language=ENGLISH&doc_id=1739585702922241#item-link-Adding%20parameters%20to%20event%20code
    if (wpmDataLayer ? .pixels ? .tiktok ? .loaded) {
        payload.tiktok = {
            event: "AddToCart",
            event_id: wpm.getRandomEventId(),
            context: wpm.getTikTokUserDataFromBrowser(),
            properties: {
                value: product.price * product.quantity,
                currency: product.currency,
                contents: [{
                    content_id: product.dyn_r_ids[wpmDataLayer.pixels.tiktok.dynamic_remarketing.id_type],
                    content_type: "product",
                    content_name: product.name,
                    quantity: product.quantity,
                    price: product.price,
                }],
            },
        }
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientSideAddToCart", payload)

    /**
     * Process the server-to-server event
     */

    wpm.sendEventPayloadToServer(payload)
})

/**
 * Begin checkout event
 */
jQuery(document).on("wpmBeginCheckout", (event) => {

    wpm.consoleLog("wpmBeginCheckout event fired", {
        event
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "beginCheckout",
    }

    // Facebook
    if (wpmDataLayer ? .pixels ? .facebook ? .loaded) {
        payload.facebook = {
            event_name: "InitiateCheckout",
            event_id: wpm.getFbRandomEventId(),
            user_data: wpm.getFbUserData(),
            event_source_url: window.location.href,
            custom_data: {},
        }

        if (wpmDataLayer ? .cart && !jQuery.isEmptyObject(wpmDataLayer.cart)) {
            payload.facebook.custom_data = {
                content_type: "product",
                content_ids: wpm.fbGetContentIdsFromCart(),
                value: wpm.getCartValue(),
                currency: wpmDataLayer.shop.currency,
            }
        }
    }

    // TikTok
    if (wpmDataLayer ? .pixels ? .tiktok ? .loaded) {
        payload.tiktok = {
            event: "InitiateCheckout",
            event_id: wpm.getRandomEventId(),
            context: wpm.getTikTokUserDataFromBrowser(),
            properties: wpm.tiktokGetPropertiesFromCart(),
        }
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientSideBeginCheckout", payload)

    /**
     * Process the server-to-server event
     */

    wpm.sendEventPayloadToServer(payload)
})

/**
 * Add to wishlist event
 */
jQuery(document).on("wpmAddToWishlist", (event, product) => {

    wpm.consoleLog("wpmAddToWishlist event fired", {
        event,
        product
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "addToWishlist",
        product: product,
    }

    // Facebook
    if (wpmDataLayer ? .pixels ? .facebook ? .loaded) {
        payload.facebook = {
            event_name: "AddToWishlist",
            event_id: wpm.getFbRandomEventId(),
            user_data: wpm.getFbUserData(),
            event_source_url: window.location.href,
            custom_data: wpm.fbGetProductDataForCapiEvent(product),
        }
    }

    // TikTok
    if (wpmDataLayer ? .pixels ? .tiktok ? .loaded) {
        payload.tiktok = {
            event: "AddToWishlist",
            event_id: wpm.getRandomEventId(),
            context: wpm.getTikTokUserDataFromBrowser(),
            properties: {
                value: product.price * product.quantity,
                currency: product.currency,
                contents: [{
                    content_id: product.dyn_r_ids[wpmDataLayer.pixels.tiktok.dynamic_remarketing.id_type],
                    content_type: "product",
                    content_name: product.name,
                    quantity: product.quantity,
                    price: product.price,
                }],
            },
        }
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientSideAddToWishlist", payload)

    /**
     * Process the server-to-server event
     */

    wpm.sendEventPayloadToServer(payload)
})

/**
 * View Item event
 */
jQuery(document).on("wpmViewItem", (event, product = null) => {

    wpm.consoleLog("wpmViewItem event fired", {
        event,
        product
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "viewItem",
        product: product,
    }

    // Facebook
    if (wpmDataLayer ? .pixels ? .facebook ? .loaded) {
        payload.facebook = {
            event_name: "ViewContent",
            event_id: wpm.getFbRandomEventId(),
            user_data: wpm.getFbUserData(),
            event_source_url: window.location.href,
            custom_data: {},
        }

        if (product) {
            payload.facebook.custom_data = wpm.fbGetProductDataForCapiEvent(product)
        }
    }

    // Pinterest
    // https://developers.pinterest.com/docs/conversions/best/
    // https://developers.pinterest.com/docs/api/v5/#operation/events/create
    // https://developers.pinterest.com/docs/conversions/event/
    if (wpmDataLayer ? .pixels ? .pinterest ? .loaded) {

        payload.pinterest = wpm.getPinterestS2SBaseData()

        payload.pinterest.event_name = "pagevisit"

        if (product) {
            payload.pinterest.custom_data = wpm.pinterestGetProductDataForCapiEvent(product)
        }
    }

    // TikTok
    if (wpmDataLayer ? .pixels ? .tiktok ? .loaded) {
        payload.tiktok = {
            event: "ViewContent",
            event_id: wpm.getRandomEventId(),
            context: wpm.getTikTokUserDataFromBrowser(),
        }

        if (product) {
            payload.tiktok.properties = {
                value: product.price * product.quantity,
                currency: product.currency,
                contents: [{
                    content_id: product.dyn_r_ids[wpmDataLayer.pixels.tiktok.dynamic_remarketing.id_type],
                    content_type: "product",
                    content_name: product.name,
                    quantity: product.quantity,
                    price: product.price,
                }],
            }
        }
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientSideViewItem", payload)

    /**
     * Process the server-to-server event
     */

    wpm.sendEventPayloadToServer(payload)
})

/**
 * View category event
 */
jQuery(document).on("wpmCategory", (event, product = null) => {

    wpm.consoleLog("wpmCategory event fired", {
        event,
        product
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "viewCategory",
    }

    // Pinterest
    // https://developers.pinterest.com/docs/conversions/best/
    // https://developers.pinterest.com/docs/api/v5/#operation/events/create
    // https://developers.pinterest.com/docs/conversions/event/
    if (wpmDataLayer ? .pixels ? .pinterest ? .loaded) {

        payload.pinterest = wpm.getPinterestS2SBaseData()

        payload.pinterest.event_name = "viewcategory"
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientSideViewCategory", payload)

    /**
     * Process the server-to-server event
     */

    wpm.sendEventPayloadToServer(payload)
})

/**
 * Search event
 */
jQuery(document).on("pmwEvent:Search", (event) => {

    wpm.consoleLog("pmwEvent:Search event fired", {
        event
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "search",
    }

    // Facebook
    if (wpmDataLayer ? .pixels ? .facebook ? .loaded) {
        payload.facebook = {
            event_name: "Search",
            event_id: wpm.getFbRandomEventId(),
            user_data: wpm.getFbUserData(),
            event_source_url: window.location.href,
            custom_data: {
                search_string: wpm.getSearchTermFromUrl(),
            },
        }
    }

    // Pinterest
    // https://developers.pinterest.com/docs/conversions/best/
    // https://developers.pinterest.com/docs/api/v5/#operation/events/create
    // https://developers.pinterest.com/docs/conversions/event/
    if (wpmDataLayer ? .pixels ? .pinterest ? .loaded) {

        payload.pinterest = wpm.getPinterestS2SBaseData()

        payload.pinterest.event_name = "search"
        payload.pinterest.custom_data = {
            search_string: wpm.getSearchTermFromUrl(),
        }
    }

    // TikTok
    if (wpmDataLayer ? .pixels ? .tiktok ? .loaded) {
        payload.tiktok = {
            event: "Search",
            event_id: wpm.getRandomEventId(),
            context: wpm.getTikTokUserDataFromBrowser(),
            properties: {
                query: wpm.getSearchTermFromUrl(),
            },
        }
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientSideSearch", payload)

    /**
     * Process the server-to-server event
     */

    wpm.sendEventPayloadToServer(payload)
})

/**
 * Place order event
 */
jQuery(document).on("wpmPlaceOrder", (event) => {

    wpm.consoleLog("wpmPlaceOrder event fired", {
        event
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "placeOrder",
    }

    // TikTok
    if (wpmDataLayer ? .pixels ? .tiktok ? .loaded) {
        payload.tiktok = {
            event: "PlaceAnOrder",
            event_id: wpm.getRandomEventId(),
            context: wpm.getTikTokUserDataFromBrowser(),
            properties: wpm.tiktokGetPropertiesFromCart(),
        }
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientPlaceOrder", payload)

    /**
     * Process the server-to-server event
     */

    wpm.sendEventPayloadToServer(payload)
})

/**
 * Order received event
 */
jQuery(document).on("wpmOrderReceivedPage", (event) => {

    wpm.consoleLog("wpmOrderReceivedPage event fired", {
        event
    })

    /**
     * Prepare the payload
     */

    let payload = {
        event: "orderReceived",
    }

    // Facebook
    if (wpmDataLayer ? .pixels ? .facebook ? .loaded) {
        payload.facebook = {
            event_name: "Purchase",
            event_id: wpmDataLayer.order.id.toString(),
            user_data: wpm.getFbUserData(),
            event_source_url: window.location.href,
            custom_data: {
                content_type: "product",
                value: wpmDataLayer.order.value.marketing,
                currency: wpmDataLayer.order.currency,
                content_ids: wpm.facebookContentIds(),
            },
        }
    }

    // Pinterest
    // https://developers.pinterest.com/docs/conversions/best/
    // https://developers.pinterest.com/docs/api/v5/#operation/events/create
    // https://developers.pinterest.com/docs/conversions/event/
    if (wpmDataLayer ? .pixels ? .pinterest ? .loaded) {

        payload.pinterest = wpm.getPinterestS2SBaseData()

        payload.pinterest.event_name = "checkout"
    }

    // TikTok
    // https://ads.tiktok.com/help/article/standard-events-parameters
    if (wpmDataLayer ? .pixels ? .tiktok ? .loaded) {
        payload.tiktok = {
            event: "CompletePayment",
            event_id: wpmDataLayer.order.id.toString(),
            context: wpm.getTikTokUserDataFromBrowser(),
            properties: {
                value: wpmDataLayer.order.value.marketing,
                currency: wpmDataLayer.order.currency,
                contents: wpm.getTikTokOrderItemIds(),
            },
        }
    }

    /**
     * Process the client-to-server event
     */

    jQuery(document).trigger("wpmClientSideOrderReceivedPage", payload)

    /**
     * Process the server-to-server event
     */

    // ! No server-to-server event is sent for this event because it is compiled and sent from the server directly
})

/**
 * Run WooCommerce specific functions
 */
jQuery(document).on("pmw:ready", async () => {

    // Only run if WooCommerce is active
    if (!wpm.isWooCommerceActive()) {
        return
    }

    /**
     * Run as soon as wpm namespace is loaded
     */

    // Watch for products visible in viewport
    wpm.startIntersectionObserverToWatch()

    // Watch for lazy loaded products
    wpm.startProductsMutationObserverToWatch()
})