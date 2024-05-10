/**
 * Create a wpm namespace under which all functions are declared
 */

// https://stackoverflow.com/a/5947280/4688612

(function(wpm, $, undefined) {

    const wpmDeduper = {
        keyName: "_wpm_order_ids",
        cookieExpiresDays: 365,
    }

    const wpmRestSettings = {
        // cookiesAvailable                  : '_wpm_cookies_are_available',
        cookiePmwRestEndpointAvailable: "restEndpointAvailable",
        restEndpointPost: "pmw/v1/test/",
        restFails: 0,
        restFailsThreshold: 10,
    }

    wpm.emailSelected = false
    wpm.paymentMethodSelected = false

    wpm.isBelowRestErrorThreshold = () => wpm.retrieveData(wpmRestSettings.restFails) <= wpmRestSettings.restFailsThreshold

    wpm.isRestEndpointAvailable = async () => {

        // If we already tested the endpoint and have a stored value, return it
        if (wpm.retrieveData(wpmRestSettings.cookiePmwRestEndpointAvailable)) {
            return wpm.retrieveData(wpmRestSettings.cookiePmwRestEndpointAvailable)
        }

        return await wpm.testEndpoint()
    }

    /**
     * Tests a given endpoint by sending a POST request. If the response status is 200, it stores `true` in the dataStorage with given cookie name; else it stores `false`.
     *
     * @param {string} url - The URL of the endpoint to test. Defaults to concatenation of `wpm.root` and `wpmRestSettings.restEndpointPost`.
     * @param {string} cookieName - The name of the cookie where the test result will be stored. Defaults to `wpmRestSettings.cookiePmwRestEndpointAvailable`.
     * @returns {Promise<boolean>} - Returns a promise that resolves to `true` if the response status is 200, and `false` otherwise.
     * @async
     */
    wpm.testEndpoint = async (
        url = wpm.root + wpmRestSettings.restEndpointPost,
        cookieName = wpmRestSettings.cookiePmwRestEndpointAvailable,
    ) => {

        const response = await fetch(url, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            keepalive: true,
        })

        if (response.status === 200) {
            wpm.storeData(cookieName, true)
            return true
        }

        if (response.status === 404) {
            wpm.storeData(cookieName, false)
            return false
        }

        if (response.status === 0) {
            wpm.storeData(cookieName, false)
            return false
        }
    }

    wpm.isWpmRestEndpointAvailable = (cookieName = wpmRestSettings.cookiePmwRestEndpointAvailable) => !!wpm.retrieveData(cookieName)

    /**
     * This function writes the provided orderId into storage. It will first retrieve the existing orderIds
     * from the storage if any, then add the new orderId into this existing array of orderIds  and stores
     * the updated array back to the storage.
     * If the function wpm.storeOrderIdOnServer exists and order_duplication_prevention is set to true in wpmDataLayer.shop,
     * this function will also store the orderId, orderKey and source on the server side using wpm.storeOrderIdOnServer.
     *
     * @param {String}  orderId  - The ID of the order to be stored.
     * @param {String}  orderKey - The Key of the order to be stored.
     * @param {String}  source - The source from which the order originated (default: 'thankyou_page').
     */
    wpm.writeOrderIdToStorage = (orderId, orderKey, source = "thankyou_page") => {

        // Get existing order ids
        let orderIds = wpm.retrieveData("orderIds", true) || []

        // Add the new order id
        orderIds.push(orderId)

        // Store the order ids
        wpm.storeData("orderIds", orderIds, true)

        if (typeof wpm.storeOrderIdOnServer === "function") {
            wpm.storeOrderIdOnServer({
                orderId: orderId,
                orderKey: orderKey,
                source: source,
            })
        }
    }

    wpm.isOrderIdStored = orderId => {

        // If order deduplication is disabled, return false
        if (!wpmDataLayer.shop.order_duplication_prevention) {
            wpm.consoleLog("order duplication prevention is off")
            return false
        }

        const orderIds = wpm.retrieveData("orderIds", true) || []
        return orderIds.includes(orderId)
    }

    /**
     * Check if the email address is valid
     *
     * https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
     * https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
     * https://fightingforalostcause.net/content/misc/2006/compare-email-regex.php
     *
     * @param email
     * @returns {boolean}
     */
    wpm.isEmail = email => {

        /**
         * GitHub Copilot generated RFC 5322 compliant regex
         * - Don't allow emails without a top-level domain like "john@localhost"
         * - Don't allow emails with dots at the end of the name like "john.doe.@example.com"
         */
        const regex = new RegExp(
            "^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))" +
            "@" +
            "((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])" +
            "|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$",
        )

        return regex.test(email)
    }

    wpm.removeProductFromCart = async (productId, quantityToRemove = null) => {

        try {

            if (!productId) throw Error("Wasn't able to retrieve a productId")

            productId = wpm.getIdBasedOndVariationsOutputSetting(productId)

            if (!productId) throw Error("Wasn't able to retrieve a productId")

            let quantity

            if (quantityToRemove == null) {
                quantity = wpmDataLayer.cart[productId].quantity
            } else {
                quantity = quantityToRemove
            }

            if (!wpmDataLayer.cart[productId]) {
                await wpm.getProductsFromBackend([productId])
            }

            let product = wpm.getProductDetailsFormattedForEvent(productId, quantity)

            jQuery(document).trigger("wpmRemoveFromCart", product)

            if (quantityToRemove == null || wpmDataLayer.cart[productId].quantity === quantityToRemove) {
                delete wpmDataLayer.cart[productId]
            } else {
                wpmDataLayer.cart[productId].quantity = wpmDataLayer.cart[productId].quantity - quantity
            }

            wpm.storeCartData(wpmDataLayer.cart)

        } catch (e) {
            wpm.consoleError(e)
        }
    }

    wpm.getIdBasedOndVariationsOutputSetting = productId => {

        try {
            if (wpmDataLayer ? .shop ? .variations_output) return productId

            if (wpmDataLayer.products[productId].is_variation) return wpmDataLayer.products[productId].parent_id

            return productId

        } catch (e) {
            console.error(e)
        }
    }

    wpm.prepareSelectors = (selectors, type) => {

        if (wpmDataLayer ? .shop ? .selectors ? .[type]) {

            // merge the selectors from the addToCartSelectors array with the selectors from the wpmDataLayer.shop.selectors.addToCart array
            selectors = selectors.concat(wpmDataLayer.shop.selectors[type])

            // Remove duplicates
            selectors = [...new Set(selectors)]

            // If one of the selectors is document, remove it
            if (selectors.indexOf("document") >= 0) {
                selectors.splice(selectors.indexOf("document"), 1)
            }

            // If one of the selectors is body, remove all others
            if (selectors.indexOf("body") >= 0) {
                selectors = ["body"]
            }
        }

        return selectors.join(", ")
    }

    // add_to_cart
    wpm.addProductToCart = async (productId, quantity) => {

        // Cast quantity to number to make sure it's a number
        quantity = Number(quantity)

        try {

            if (!productId) throw Error("Wasn't able to retrieve a productId")

            productId = wpm.getIdBasedOndVariationsOutputSetting(productId)

            if (!productId) throw Error("Wasn't able to retrieve a productId")

            if (!wpmDataLayer ? .products[productId]) {
                await wpm.getProductsFromBackend([productId])
            }

            let product = wpm.getProductDetailsFormattedForEvent(productId, quantity)

            jQuery(document).trigger("wpmAddToCart", product)

            // add product to cart wpmDataLayer['cart']

            // if the product already exists in the object, only add the additional quantity
            // otherwise create that product object in the wpmDataLayer['cart']
            if (wpmDataLayer ? .cart[productId]) {

                wpmDataLayer.cart[productId].quantity = wpmDataLayer.cart[productId].quantity + quantity
            } else {

                if (!("cart" in wpmDataLayer)) wpmDataLayer.cart = {}

                wpmDataLayer.cart[productId] = wpm.getProductDetailsFormattedForEvent(productId, quantity)
            }

            wpm.storeCartData(wpmDataLayer.cart)

        } catch (e) {
            console.error(e)

            // fallback if wpmDataLayer.cart and wpmDataLayer.products got out of sync in case cart caching has an issue
            wpm.getCartItemsFromBackend()
        }
    }

    wpm.initCart = () => {

        // If the WC cart doesn't exist, eg. after a confirmed purchase,
        // and we still have a cart object in the storage, reset it.
        if (!wpm.doesWooCommerceCartExist() &&
            Object.keys(wpm.retrieveCartData()).length !== 0
        ) {
            wpm.storeCartData({})
            return
        }

        // If the cart object is in the storage, use it
        if (wpm.retrieveCartData()) {
            wpm.saveCartObjectToDataLayer(wpm.retrieveCartData())
            return
        }

        // If the cart object is missing in the storage, create an empty one and get the cart items from the backend
        wpm.storeCartData({})
        wpm.getCartItemsFromBackend()
    }

    // get all cart items from the backend
    wpm.getCartItemsFromBackend = () => {
        try {

            /**
             * Can't use a REST API endpoint, as the cart session will not be loaded if the
             * endpoint is called.
             *
             * https://wordpress.org/support/topic/wc-cart-is-null-in-custom-rest-api/#post-11442843
             */

            /**
             * Get the cart items from the backend the data object using fetch API
             * and log success or error messages
             * and url encoded data
             */
            fetch(wpm.ajax_url, {
                    method: "POST",
                    cache: "no-cache",
                    body: new URLSearchParams({
                        action: "pmw_get_cart_items"
                    }),
                    keepalive: true,
                })
                .then(response => {
                    if (response.ok) {
                        return response.json()
                    } else {
                        throw Error("Error getting cart items from backend")
                    }
                })
                .then(data => {

                    if (data.success) {

                        if (!data.data["cart"]) data.data["cart"] = {}
                        wpm.saveCartObjectToDataLayer(data.data["cart"])
                        wpm.storeCartData(data.data["cart"])

                    } else {
                        throw Error("Error getting cart items from backend")
                    }
                })

        } catch (e) {
            console.error(e)
        }
    }

    // Get product IDs from the backend
    wpm.getProductsFromBackend = async productIds => {

        if (wpmDataLayer ? .products) {
            // If productIds already exists as key in wpmDataLayer.products, remove it from the array
            productIds = productIds.filter(productId => !(productId in wpmDataLayer.products))
        }

        // If no product IDs are in the object, don't try to get anything from the server
        if (!productIds || productIds.length === 0) return

        // if no page_id is set, don't try to get anything from the server
        if (!wpmDataLayer.general.page_id) return

        // if productIds is not an array, or it's an empty array, don't try to get anything from the server
        if (!Array.isArray(productIds) || productIds.length === 0) return

        try {

            let data = {
                action: "pmw_get_product_ids", // for the AJAX call
                page_id: wpmDataLayer.general.page_id,
                page_type: wpmDataLayer.shop.page_type,
                product_ids: productIds,
            }

            const isRestEndpointAvailable = await wpm.isRestEndpointAvailable()
            const url = isRestEndpointAvailable ? wpm.root + "pmw/v1/products/" : wpm.ajax_url

            const options = {
                method: "POST",
                cache: "no-cache",
                body: isRestEndpointAvailable ? JSON.stringify(data) : new URLSearchParams(data),
            }

            // If the REST API is available, set the headers to JSON
            if (isRestEndpointAvailable) {
                options.headers = {
                    "Content-Type": "application/json"
                }
            }

            let response = await fetch(url, options)

            if (!response.ok) {
                throw new Error("Error getting products from backend. Status: " + response.status + " Status text: " + response.statusText)
            }

            let responseData = await response.json()

            if (!responseData.success) {
                throw new Error("Error getting products from backend: " + responseData.data)
            }

            wpmDataLayer.products = Object.assign({}, wpmDataLayer.products, responseData.data)

        } catch (e) {
            console.error(e)
        }

        return true
    }

    wpm.saveCartObjectToDataLayer = cartObject => {

        wpmDataLayer.cart = cartObject
        wpmDataLayer.products = Object.assign({}, wpmDataLayer.products, cartObject)
    }

    wpm.triggerViewItemEventPrep = async productId => {

        if (wpmDataLayer.products && wpmDataLayer.products[productId]) {

            wpm.triggerViewItemEvent(productId)
        } else {
            await wpm.getProductsFromBackend([productId])
            wpm.triggerViewItemEvent(productId)
        }
    }

    wpm.triggerViewItemEvent = productId => {

        let product = wpm.getProductDetailsFormattedForEvent(productId)

        jQuery(document).trigger("wpmViewItem", product)
    }

    wpm.triggerViewItemEventNoProduct = () => {
        jQuery(document).trigger("wpmViewItem")
    }

    wpm.fireCheckoutOption = (step, checkout_option = null, value = null) => {

        let data = {
            step: step,
            checkout_option: checkout_option,
            value: value,
        }

        jQuery(document).trigger("wpmFireCheckoutOption", data)
    }

    wpm.fireCheckoutProgress = step => {

        let data = {
            step: step,
        }

        jQuery(document).trigger("wpmFireCheckoutProgress", data)
    }

    wpm.getPostIdFromString = string => {

        try {
            return string.match(/(post-)(\d+)/)[2]
        } catch (e) {
            console.error(e)
        }
    }

    wpm.triggerViewItemList = productId => {

        if (!productId) throw Error("Wasn't able to retrieve a productId")

        productId = wpm.getIdBasedOndVariationsOutputSetting(productId)

        if (!productId) throw Error("Wasn't able to retrieve a productId")

        jQuery(document).trigger("wpmViewItemList", wpm.getProductDataForViewItemEvent(productId))
    }

    wpm.getProductDataForViewItemEvent = productId => {

        if (!productId) throw Error("Wasn't able to retrieve a productId")

        try {
            if (wpmDataLayer.products[productId]) {

                return wpm.getProductDetailsFormattedForEvent(productId)
            }
        } catch (e) {
            console.error(e)
        }
    }

    wpm.getMainProductIdFromProductPage = () => {

        try {
            if (["simple", "variable", "grouped", "composite", "bundle"].indexOf(wpmDataLayer.shop.product_type) >= 0) {
                return jQuery(".wpmProductId:first").data("id")
            } else {
                return false
            }
        } catch (e) {
            console.error(e)
        }
    }

    wpm.viewItemListTriggerTestMode = target => {

        jQuery(target).css({
            "position": "relative"
        })
        jQuery(target).append("<div id=\"viewItemListTriggerOverlay\"></div>")
        jQuery(target).find("#viewItemListTriggerOverlay").css({
            "z-index": "10",
            "display": "block",
            "position": "absolute",
            "height": "100%",
            "top": "0",
            "left": "0",
            "right": "0",
            "opacity": wpmDataLayer.shop.view_item_list_trigger.opacity,
            "background-color": wpmDataLayer.shop.view_item_list_trigger.background_color,
        })
    }

    wpm.getSearchTermFromUrl = () => {

        try {
            let urlParameters = new URLSearchParams(window.location.search)
            return urlParameters.get("s")
        } catch (e) {
            console.error(e)
        }
    }

    // we need this to track timeouts for intersection observers
    let ioTimeouts = {}

    wpm.observerCallback = (entries, observer) => {

        entries.forEach((entry) => {

            try {
                let productId

                let elementId = jQuery(entry.target).data("ioid")

                // Get the productId from next element, if wpmProductId is a sibling, like in Gutenberg blocks
                // otherwise go search in children, like in regular WC loop items
                if (jQuery(entry.target).next(".wpmProductId").length) {
                    // console.log('test 1');
                    productId = jQuery(entry.target).next(".wpmProductId").data("id")
                } else {
                    productId = jQuery(entry.target).find(".wpmProductId").data("id")
                }


                if (!productId) throw Error("wpmProductId element not found")

                if (entry.isIntersecting) {

                    ioTimeouts[elementId] = setTimeout(() => {

                        wpm.triggerViewItemList(productId)
                        if (wpmDataLayer.shop.view_item_list_trigger.test_mode) wpm.viewItemListTriggerTestMode(entry.target)
                        if (wpmDataLayer.shop.view_item_list_trigger.repeat === false) observer.unobserve(entry.target)
                    }, wpmDataLayer.shop.view_item_list_trigger.timeout)

                } else {

                    clearTimeout(ioTimeouts[elementId])
                    if (wpmDataLayer.shop.view_item_list_trigger.test_mode) jQuery(entry.target).find("#viewItemListTriggerOverlay").remove()
                }
            } catch (e) {
                console.error(e)
            }
        })
    }

    // fire view_item_list only on products that have become visible
    let io
    let ioid = 0

    const getCommonIdentifiersToWatch = () => {

        let listOfClassNames = {
            nested: [],
            flat: [],
        }

        try {

            const haveSameNestingDepth = (element1, element2) => {

                // If both are the same, return the parent
                return jQuery(element1).parents().length === jQuery(element2).parents().length
            }

            const findCommonParentElement = (element1, element2) => {
                // If both are the same, return the parent
                if (jQuery(element1).parent().is(jQuery(element2).parent())) {
                    return {
                        node: jQuery(element1).parent(),
                        type: "flat",
                    }
                }

                return {
                    node: jQuery(element1).parents().has(jQuery(element2).parents()).first(),
                    type: "nested",
                }
            }

            const countOfChildren = (element) => {
                // Return the count of "wpmProductId" elements
                return jQuery(element).find(".wpmProductId").length
            }

            const getCommonClass = (classes1, classes2) => {

                // console.log("classes1", classes1);
                // console.log("classes2", classes2);
                // classes 1 and 2 are arrays of classes
                // They may contain the same classes, but not in the same order
                // Return the first common class that's present in both arrays

                return classes1.filter(value => classes2.includes(value))[0] || null
            }

            const wpmProductIds = document.querySelectorAll(".wpmProductId")

            // If zero or only one product template is found, then we can't run the algorithm
            if (wpmProductIds.length === 1) {
                // console.log("No product or too few templates found")
                return listOfClassNames
            }

            // console.log("wpmProductIds", wpmProductIds);
            // console.log("looping")

            for (let i = 0; i < wpmProductIds.length - 1; i++) {

                // console.log("i", i)

                if (!haveSameNestingDepth(wpmProductIds[i], wpmProductIds[i + 1])) {
                    // console.log("The nesting depth is not the same")
                    i++
                    continue
                }

                let productsNode = findCommonParentElement(wpmProductIds[i], wpmProductIds[i + 1])
                // console.log("productsNode.node", productsNode.node)
                // console.log("productsNode.type", productsNode.type)

                // If the productsNode is nested, get the first class of the first child. Then console log the class
                if (productsNode.type === "nested") {

                    let firstChildClasses = productsNode.node.children().first().attr("class").split(" ")
                    let secondChildClasses = productsNode.node.children().first().next().attr("class").split(" ")

                    const commonClass = getCommonClass(firstChildClasses, secondChildClasses)

                    listOfClassNames.nested.push(commonClass)
                } else if (productsNode.type === "flat") {

                    // If class is not found, continue
                    if (!productsNode.node.children().first().attr("class")) continue

                    // firstProductTemplateClasses is the classes of the first child element of the productsNode
                    let firstProductTemplateClasses = productsNode.node.children().first().attr("class").split(" ")[0]

                    listOfClassNames.flat.push(firstProductTemplateClasses)
                }

                // which wpmProductIds is the last one in the productsNode? console log the index of the last wpmProductId in the productsNode
                // console.log("productsNode.children().length", countOfChildren(productsNode));

                i = i + countOfChildren(productsNode.node) - 1
            }

            // Make the list of class names unique
            listOfClassNames.nested = [...new Set(listOfClassNames.nested)]
            listOfClassNames.flat = [...new Set(listOfClassNames.flat)]

            return listOfClassNames

        } catch (e) {
            console.error(e)
            return listOfClassNames
        }
    }


    let detectedProductTemplateClasses = {
        nested: [],
        flat: [],
    }

    const isNestedClass = (elem) => {
        let nestedClassNames = [
            "product",
            "type-product",
            "product-item-inner",
            ...detectedProductTemplateClasses.nested,
        ]

        return nestedClassNames.some(className => jQuery(elem).closest("." + className).length)
    }

    const isFlatClass = (elem) => {

        let flatClassNames = [
            "wc-block-grid__product",
            "product",
            "product-small",
            "woocommerce-LoopProduct-link",
            ...detectedProductTemplateClasses.flat,
        ]

        return flatClassNames.some(className => jQuery(elem).prev().hasClass(className))
    }

    const getAllElementsToWatch = () => {

        detectedProductTemplateClasses = getCommonIdentifiersToWatch()

        return jQuery(".wpmProductId")
            .map(function(i, elem) {

                if (isNestedClass(elem)) {
                    return jQuery(elem).parent()
                } else if (isFlatClass(elem)) {
                    return jQuery(this).prev()
                } else if (jQuery(elem).closest(".product").length) {
                    return jQuery(elem).closest(".product")
                }
            })
    }

    wpm.startIntersectionObserverToWatch = () => {

        try {
            // enable view_item_list test mode from browser
            if (wpm.urlHasParameter("vildemomode")) wpmDataLayer.shop.view_item_list_trigger.test_mode = true

            // set up intersection observer
            // https://stackoverflow.com/questions/62084306/intersectionobserver-not-working-in-safari-or-ios
            io = new IntersectionObserver(wpm.observerCallback, {
                root: null,
                // root     : document.body,
                threshold: wpmDataLayer.shop.view_item_list_trigger.threshold,
            })

            getAllElementsToWatch().each((i, elem) => {

                jQuery(elem[0]).data("ioid", ioid++)

                io.observe(elem[0])
            })
        } catch (e) {
            console.error(e)
        }
    }

    // Watch DOM for new lazy loaded products and add them to the intersection observer
    wpm.startProductsMutationObserverToWatch = () => {

        try {
            // Pass in the target node, as well as the observer options

            // selects the most common parent node
            // https://stackoverflow.com/a/7648323/4688612
            let productsNode = jQuery(".wpmProductId:eq(0)").parents().has(jQuery(".wpmProductId:eq(1)").parents()).first()

            if (productsNode.length) {
                productsMutationObserver.observe(productsNode[0], {
                    attributes: true,
                    childList: true,
                    characterData: true,
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    // Create an observer instance
    const productsMutationObserver = new MutationObserver(mutations => {

        mutations.forEach(mutation => {
            let newNodes = mutation.addedNodes // DOM NodeList
            if (newNodes !== null) { // If there are new nodes added
                let nodes = jQuery(newNodes) // jQuery set
                nodes.each((i, node) => {
                    if (
                        // jQuery(this).hasClass("type-product") ||
                        // jQuery(this).hasClass("product-small") ||
                        // jQuery(this).hasClass("wc-block-grid__product")
                        // jQuery(this).hasClass("type-product")
                        isNestedClass(node) || isFlatClass(node)
                    ) {
                        // check if the node has a child or sibling wpmProductId
                        // if yes add it to the intersectionObserver
                        if (hasWpmProductIdElement(node)) {
                            jQuery(node).data("ioid", ioid++)
                            io.observe(node)
                        }
                    }
                })
            }
        })
    })

    let hasWpmProductIdElement = elem =>
        !!(jQuery(elem).find(".wpmProductId").length ||
            jQuery(elem).siblings(".wpmProductId").length)

    /**
     * Sets a new cookie or updates an existing one with the provided name and value.
     *
     * @function setCookie
     * @global
     * @param {string} cookieName - The name of the cookie.
     * @param {string} [cookieValue=""] - The value to set for the cookie. Default value is an empty string.
     * @param {number|null} [expiryDays=null] - The number of days until the cookie expires. If not provided, the cookie will last until the end of the session.
     * @returns {void}
     *
     * @example
     * // This will create a cookie "username" with the value "JohnDoe" that expires in 7 days
     * wpm.setCookie("username", "JohnDoe", 7);
     */
    wpm.setCookie = (cookieName, cookieValue = "", expiryDays = null) => {

        if (expiryDays) {

            let d = new Date()
            d.setTime(d.getTime() + (expiryDays * 24 * 60 * 60 * 1000))
            let expires = "expires=" + d.toUTCString()
            document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/"
        } else {
            document.cookie = cookieName + "=" + cookieValue + ";path=/"
        }
    }

    /**
     * Retrieves the value of a specific cookie from the document's cookie string.
     *
     * @param {String} cookieName - The name of the cookie to retrieve.
     * @returns {String} - The value of the cookie if found, an empty string otherwise.
     *
     * @example
     * // returns 'value' if 'cookieName=value' exists in document.cookie
     * wpm.getCookie('cookieName')
     */
    wpm.getCookie = cookieName => {

        let name = cookieName + "="
        let decodedCookie = decodeURIComponent(document.cookie)
        let ca = decodedCookie.split(";")

        for (let i = 0; i < ca.length; i++) {

            let c = ca[i]

            while (c.charAt(0) == " ") {
                c = c.substring(1)
            }

            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length)
            }
        }

        return ""
    }

    /**
     * Find and get the cookie with a name that contains the string.
     * If one is found, then return the cookie.
     * If none is found, then return false.
     *
     * @param string
     * @returns {boolean|string}
     *
     * @since 1.32.5
     */
    wpm.getCookieThatContainsRegex = (regex) => {

        let cookies = document.cookie.split(";")

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim()

            if (regex.test(cookie)) {
                return cookie
            }
        }

        return false
    }

    wpm.deleteCookie = cookieName => {
        wpm.setCookie(cookieName, "", -1)
    }

    /**
     * Store data in the browser
     *
     * Try to store the data in the local storage (session or persistent) if available.
     * If not available, store the data in the cookie.
     *
     * Max cookie expiry is 400 days as specified by Google Chrome: https://developer.chrome.com/blog/cookie-max-age-expires/
     *
     * @param key
     * @param value
     * @param persistent
     * @param extension - If true, this will be saved in a separate key
     */
    wpm.storeData = (key, value, persistent = false, extension = false) => {

        const suffix = extension ? key : ""

        let dataGetter = persistent ? wpm.getPersistentData : wpm.getSessionData
        let dataSetter = persistent ? wpm.setPersistentData : wpm.setSessionData

        let data = dataGetter(suffix)
        extension ? data = value : data[key] = value

        dataSetter(data, suffix)
    }

    wpm.retrieveData = (key, persistent = false, extension = false) => {

        const suffix = extension ? key : ""

        let data = persistent ? wpm.getPersistentData(suffix) : wpm.getSessionData(suffix)

        return extension ? data : data[key]
    }

    wpm.deleteDataKey = (key, persistent = false, extension = false) => {

        const suffix = extension ? key : ""

        let dataGetter = persistent ? wpm.getPersistentData : wpm.getSessionData
        let dataSetter = persistent ? wpm.setPersistentData : wpm.setSessionData

        let data = dataGetter(suffix)
        // extension ? delete data : delete data[key]

        if (extension) {

            try {
                if (persistent && window.localStorage) window.localStorage.removeItem(wpm.getPersistentDataKey(suffix))
                if (!persistent && window.sessionStorage) window.sessionStorage.removeItem(wpm.getSessionDataKey(suffix))

            } catch (e) {
                console.error(e)
            }

            return
        }

        delete data[key]

        dataSetter(data, suffix)
    }

    wpm.storeCartData = data => {
        wpm.storeData("cart", data, false, true)
    }

    wpm.retrieveCartData = () => {
        return wpm.retrieveData("cart", false, true)
    }

    wpm.getSessionDataKey = (suffix = "") => {
        const defaultStorageKey = "_pmw_session_data"

        if (suffix) {
            return defaultStorageKey + "_" + suffix
        }

        return defaultStorageKey
    }

    wpm.getPersistentDataKey = (storageKeySuffix) => {

        const defaultStorageKey = "_pmw_persistent_data"

        if (storageKeySuffix) {
            return defaultStorageKey + "_" + storageKeySuffix
        }

        return defaultStorageKey
    }

    wpm.getSessionData = (suffix = "") => {

        if (window.sessionStorage) {

            let data = window.sessionStorage.getItem(wpm.getSessionDataKey(suffix))

            return data !== null ? JSON.parse(data) : {}
        } else {
            // fallback to cookie
            let data = wpm.getCookie(wpm.getSessionDataKey(suffix))

            return data !== "" ? JSON.parse(data) : {}
        }
    }

    wpm.setSessionData = (data, storageKeySuffix = "") => {
        if (window.sessionStorage) {
            window.sessionStorage.setItem(wpm.getSessionDataKey(storageKeySuffix), JSON.stringify(data))
        } else {
            // fallback to cookie
            wpm.setCookie(wpm.getSessionDataKey(storageKeySuffix), JSON.stringify(data))
        }
    }

    wpm.getPersistentData = (storageKeySuffix) => {

        if (window.localStorage) {

            let data = window.localStorage.getItem(wpm.getPersistentDataKey(storageKeySuffix))

            return data !== null ? JSON.parse(data) : {}
        } else {
            // fallback to cookie
            let data = wpm.getCookie(wpm.getPersistentDataKey(storageKeySuffix))

            return data !== "" ? JSON.parse(data) : {}
        }
    }

    wpm.setPersistentData = (data, storageKeySuffix = "") => {

        if (window.localStorage) {
            window.localStorage.setItem(wpm.getPersistentDataKey(storageKeySuffix), JSON.stringify(data))
        } else {
            // fallback to cookie
            wpm.setCookie(wpm.getPersistentDataKey(storageKeySuffix), JSON.stringify(data), 400)
        }
    }

    wpm.storeOrderIdOnServer = async (orderDetails) => {

        try {

            let response

            if (await wpm.isRestEndpointAvailable()) {

                response = await fetch(wpm.root + "pmw/v1/pixels-fired/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        // "X-WP-Nonce"  : wpm.nonce_wp_rest,
                    },
                    body: JSON.stringify({
                        order_id: orderDetails.orderId,
                        order_key: orderDetails.orderKey,
                        source: orderDetails.source,
                        // nonce   : wpm.pmw_nonce,
                    }),
                    keepalive: true,
                    cache: "no-cache",
                })

            } else {

                wpm.consoleLog("REST API not available, falling back to AJAX")

                // save the state in the database

                // Send the data object with ajax request
                // and log success or error using fetch API and url encoded
                response = await fetch(wpm.ajax_url, {
                    method: "POST",
                    body: new URLSearchParams({
                        action: "pmw_purchase_pixels_fired",
                        order_id: orderDetails.orderId,
                        order_key: orderDetails.orderKey,
                        source: orderDetails.source,
                        // nonce_ajax: wpm.nonce_ajax,
                    }),
                    keepalive: true,
                })
            }

            const responseJson = await response.json()

            if (responseJson.success) {
                wpm.consoleLog("", responseJson.data)
            } else {
                wpm.consoleError("", responseJson.data)
            }

        } catch (e) {
            console.error(e)
        }
    }

    wpm.getProductIdByCartItemElement = element => {

        const href = jQuery(element).find(".product-remove").find("a").attr("href")
        if (href) return wpm.getProductIdByCartItemKeyUrl(new URL(href))

        const productId = jQuery(element).find("[data-product_id]").first().attr("data-product_id")
        return productId ? productId : null
    }

    wpm.getProductQuantityByCartItemElement = element => {

        return jQuery(element).find(".qty").val() || null
    }

    wpm.getProductIdByCartItemKeyUrl = url => {

        let searchParams = new URLSearchParams(url.search)
        let cartItemKey = searchParams.get("remove_item")

        let productId

        if (wpmDataLayer.cart_item_keys[cartItemKey]["variation_id"] === 0) {
            productId = wpmDataLayer.cart_item_keys[cartItemKey]["product_id"]
        } else {
            productId = wpmDataLayer.cart_item_keys[cartItemKey]["variation_id"]
        }

        return productId
    }

    wpm.getAddToCartLinkProductIds = () =>
        jQuery("a").map(function() {
            let href = jQuery(this).attr("href")

            if (href && href.includes("?add-to-cart=")) {
                let matches = href.match(/(add-to-cart=)(\d+)/)
                if (matches) return matches[2]
            }
        }).get()

    wpm.getProductDetailsFormattedForEvent = (productId, quantity = 1) => {

        let product = {
            id: productId.toString(),
            dyn_r_ids: wpmDataLayer.products[productId].dyn_r_ids,
            name: wpmDataLayer.products[productId].name,
            list_name: wpmDataLayer.shop.list_name,
            brand: wpmDataLayer.products[productId].brand,
            category: wpmDataLayer.products[productId].category,
            variant: wpmDataLayer.products[productId].variant,
            list_position: wpmDataLayer.products[productId].position,
            quantity: quantity,
            price: wpmDataLayer.products[productId].price,
            currency: wpmDataLayer.shop.currency,
            is_variable: wpmDataLayer.products[productId].is_variable,
            is_variation: wpmDataLayer.products[productId].is_variation,
            parent_id: wpmDataLayer.products[productId].parent_id,
        }

        if (product.is_variation) product["parent_id_dyn_r_ids"] = wpmDataLayer.products[productId].parent_id_dyn_r_ids

        return product
    }

    wpm.getClidFromBrowser = (clidId = "gclid") => {

        let clidCookieId

        clidCookieId = {
            gclid: "_gcl_aw",
            dclid: "_gcl_dc",
        }

        if (wpm.getCookie(clidCookieId[clidId])) {

            let clidCookie = wpm.getCookie(clidCookieId[clidId])
            let matches = clidCookie.match(/(GCL.[\d]*.)(.*)/)
            return matches[2]
        } else {
            return ""
        }
    }

    wpm.getUserAgent = () => navigator.userAgent

    wpm.getViewPort = () => ({
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    })


    wpm.consoleLogVersion = () => {
        console.log(wpmDataLayer.version)
    }

    /**
     * https://api.jquery.com/jquery.getscript/
     *
     * Switched back to jQuery.ajax as the fetch method on some sites returned a type error
     * Possible reasons are:
     *    * CORS mismatch
     *    * The user is using an ad blocker
     *
     * This code is .thenable
     */

    wpm.loadScriptAndCacheIt = url => {

        // Get and load the script using fetch API, if possible from cache, and return it without using eval
        // return fetch(url, {
        // 	method   : "GET",
        // 	cache    : "default",
        // 	keepalive: true,
        // })
        // 	.then(response => {
        // 		if (response.ok) {
        // 			// console.log("response", response)
        // 			return response.text()
        // 			// console.log("wpm.loadScriptAndCacheIt success: " + url)
        // 		} else {
        // 			throw new Error("Network response was not ok: " + url)
        // 		}
        // 	})
        // 	.then(script => {
        // 		// Execute the script
        // 		// console.error("executing script: " + script)
        // 		eval(script)
        // 		// console.log("executed script: " + script)
        // 	})
        // 	.catch(e => {
        // 		console.error(e)
        // 	})

        let options = {
            dataType: "script",
            cache: true,
            url: url,
        }

        return jQuery.ajax(options)
    }

    wpm.getOrderItemPrice = orderItem => (orderItem.total + orderItem.total_tax) / orderItem.quantity

    wpm.hasLoginEventFired = () => {
        let data = wpm.getSessionData()
        return data ? .loginEventFired
    }

    wpm.setLoginEventFired = () => {
        let data = wpm.getSessionData()
        data["loginEventFired"] = true
        wpm.setSessionData(data)
    }

    wpm.pageLoaded = async () => new Promise(resolve => {
        (function waitForVar() {
            if ("complete" === document.readyState) return resolve()
            setTimeout(waitForVar, 50)
        })()
    })

    wpm.pageReady = () => {
        return new Promise(resolve => {
            (function waitForVar() {
                if ("interactive" === document.readyState || "complete" === document.readyState) return resolve()
                setTimeout(waitForVar, 50)
            })()
        })
    }

    wpm.isMiniCartActive = () => {
        if (window.sessionStorage) {
            Object.keys(window.sessionStorage).forEach(key => {
                if (key.includes("wc_fragments")) {
                    return true
                }
            })
        }

        return false
    }

    wpm.doesWooCommerceCartExist = () => document.cookie.includes("woocommerce_items_in_cart")

    wpm.urlHasParameter = parameter => {
        let urlParams = new URLSearchParams(window.location.search)
        return urlParams.has(parameter)
    }

    wpm.getUrlParameter = parameter => {
        let urlParams = new URLSearchParams(window.location.search)
        return urlParams.get(parameter)
    }

    // https://stackoverflow.com/a/60606893/4688612
    wpm.hashAsync = (algo, str) => {
        return crypto.subtle.digest(algo, new TextEncoder("utf-8").encode(str)).then(buf => {
            return Array.prototype.map.call(new Uint8Array(buf), x => (("00" + x.toString(16)).slice(-2))).join("")
        })
    }

    wpm.getCartValue = () => {

        let value = 0

        if (wpmDataLayer ? .cart) {

            for (const key in wpmDataLayer.cart) {
                // content_ids.push(wpmDataLayer.products[key].dyn_r_ids[wpmDataLayer.pixels.facebook.dynamic_remarketing.id_type])

                let product = wpmDataLayer.cart[key]

                value += product.quantity * product.price
            }
        }

        return value
    }

    /**
     * Detect if the current URL contains at least one pattern
     *
     * @param patterns
     * @returns {boolean}
     */
    wpm.doesUrlContainPatterns = patterns => {

        for (const pattern of patterns) {
            if (new RegExp(pattern).test(window.location.href)) {
                return true
            }
        }

        return false
    }

    /**
     * Detect if the current URL contains at least one pattern that is on the tracking exclusion list
     *
     * https://www.linkedin.com/pulse/how-remove-google-robot-problem-via-gtm-facebook-pixel-hjelpdahl/
     * https://www.youtube.com/watch?v=b4I1ePZt8Z0
     *
     * @returns {boolean}
     */
    wpm.excludeDomainFromTracking = () => {

        let exclude_domains = [
            "appspot.com",
            "translate.google.com",
        ]

        if (wpmDataLayer ? .general ? .exclude_domains) {
            exclude_domains = [...exclude_domains, ...wpmDataLayer.general.exclude_domains]
        }

        // Abort if URL contains excluded domains
        if (exclude_domains.some(domain => window.location.href.includes(domain))) {
            console.debug("Pixel Manager: Aborted due to excluded domain")
            return true
        }

        return false
    }

    wpm.getRandomEventId = () => (Math.random() + 1).toString(36).substring(2)

    wpm.pmwConsoleMessage = () => {
        let message = "Pixel Manager for WooCommerce: "
        message += wpmDataLayer.version.pro ? "pro" : "free"
        message += " | distro: " + wpmDataLayer.version.distro
        if (wpmDataLayer.version.distro === "fms" && wpmDataLayer.version.pro) {
            message += " | active license: " + (wpmDataLayer.version.eligible_for_updates ? "yes" : "no")
        }
        message += " | version: " + wpmDataLayer.version.number

        if (wpmDataLayer.version.show === true) {
            console.log(message)
        } else {
            wpm.consoleLog(message)
        }
    }

    wpm.canLoadPremiumFeatures = () => {
        return (wpmDataLayer.version.distro === "fms" && wpmDataLayer.version.pro && wpmDataLayer.version.eligible_for_updates) || wpmDataLayer.version.distro === "wcm"
    }

    let jQueryReadyFired = false

    wpm.triggerDomReadyEvent = () => {
        if (jQueryReadyFired === false) {
            document.dispatchEvent(new Event("pmw:ready"))
        }
        jQueryReadyFired = true
    }

    /**
     * jQuery ready event
     */
    jQuery(() => {
        wpm.triggerDomReadyEvent()
    })

    document.addEventListener("DOMContentLoaded", () => {
        wpm.triggerDomReadyEvent()
    })

    wpm.getEmailFromTarget = target => {

        // Only try to add the clicked email if href is set
        if (target.href) {

            // Get the email from the link
            // But only if there is a valid email address in the link
            // Also, the href may contain other parameters, so we need to check for that and remove them
            let email = target.href.replace("mailto:", "")


            if (email.indexOf("?") > -1) {
                email = email.split("?")[0]
            }

            // Trim the email and remove all whitespaces
            email = email.replace(/\s/g, "")

            // If the email is not empty and valid, add it to the data object
            if (email && wpm.isEmail(email)) {
                return email
            }
        }

        return ""
    }

    wpm.sendEventPayloadToServer = payload => {
        if (typeof wpm.sendEventPayloadToServerPremium === "function") {
            wpm.sendEventPayloadToServerPremium(payload)
        }
    }

    const urlLoggerOn = () => {

        if (wpm.urlHasParameter("pmwloggeron")) {
            wpm.storeData("loggerEnabled", true)
        }

        return wpm.urlHasParameter("pmwloggeron")
    }

    const urlLoggerOff = () => {

        if (wpm.urlHasParameter("pmwloggeroff")) {
            wpm.storeData("loggerEnabled", false)
        }

        return wpm.urlHasParameter("pmwloggeroff")
    }

    const sessionLoggerEnabled = () => {
        return wpm.retrieveData("loggerEnabled")
    }

    const isLoggerEnabled = () => {

        if (urlLoggerOff()) return false

        if (sessionLoggerEnabled()) return true

        if (urlLoggerOn()) return true

        return !!wpmDataLayer ? .general ? .logger ? .is_active
    }

    // create a wpm.log function that takes in a message and one or more objects and passes it to console.log
    wpm.consoleLog = (message, ...objects) => {

        if (!isLoggerEnabled()) return

        if (objects.length) {
            console.log("Pixel Manager: " + message, ...objects)
        } else {
            console.log("Pixel Manager: " + message)
        }
    }

    wpm.consoleError = (message, ...objects) => {

        // if (!isLoggerEnabled()) return

        if (objects.length) {
            console.error("Pixel Manager: " + message, ...objects)
        } else {
            console.error("Pixel Manager: " + message)
        }
    }

    /**
     * Triggers the queued events for a pixel.
     * This function is responsible for executing the events that have been
     * queued up for a specific pixel.
     *
     * @param {string} pixel - The pixel function name.
     * @returns {void}
     */
    wpm.triggerQueuedEvents = (pixel) => {
        if (window.pmw_event_queue && window.pmw_event_queue[pixel]) {
            window.pmw_event_queue[pixel].forEach(func => {
                func()
            })
        }
    }

    wpm.isWooCommerceActive = () => {
        return !!wpmDataLayer.shop
    }

}(window.wpm = window.wpm || {}, jQuery))