/**
 * Register event listeners
 */


/**
 * add_to_cart event
 *
 * WC is inconsistent with events that emit add-to-cart events.
 * adding_to_cart and added_to_are legacy events. Also, they only work
 * on Ajax buttons on shop pages.
 *
 * Never add document or body selectors.
 * The document selector doesn't work.
 * The body selector will cause the events to fire twice and other erratic behavior if used along with other selectors.
 */
const addToCartSelectorsArray = [
    // "document",
    // "body",
    ".add_to_cart_button:not(.product_type_variable)",
    ".ajax_add_to_cart",
    ".single_add_to_cart_button",
]

const addToCartSelectors = wpm.prepareSelectors(addToCartSelectorsArray, "addToCart")

jQuery(addToCartSelectors).on("click adding_to_cart", (event, data) => {

    // console.log("add_to_cart event fired at: " + new Date().getTime())
    // console.log('add to cart data', data)
    // console.log('add to cart event', event)
    // console.log('add to cart jQuery(event.target.dataset)', jQuery(event.target.dataset))
    // console.log("add to cart event.target.dataset", event.target.dataset)
    // console.log("add to cart event.target.dataset.quantity", event.target.dataset.quantity)
    // console.log("add to cart event.target.dataset.product_id", event.target.dataset.product_id)

    try {

        // console.log("add_to_cart event detected")

        let quantity = event ? .target ? .dataset ? .quantity ? event.target.dataset.quantity : null
        let productId = event ? .target ? .dataset ? .product_id ? event.target.dataset.product_id : event ? .target ? .value ? event.target.value : null;

        // let quantity  = event.target.dataset.quantity ? event.target.dataset.quantity : 1
        // let productId = event.target.dataset.product_id ? event.target.dataset.product_id : null

        // Only process on product pages
        if (wpmDataLayer.shop.page_type === "product") {

            // First process related and upsell products
            if (
                typeof jQuery(event.currentTarget).attr("href") !== "undefined" &&
                jQuery(event.currentTarget).attr("href").includes("add-to-cart")
            ) {

                if (!productId) {
                    productId = jQuery(event.currentTarget).data("product_id")
                }

                wpm.addProductToCart(productId, 1)
                return
            }

            // If is simple product
            if (wpmDataLayer.shop.product_type === "simple") {

                if (quantity === null) {
                    quantity = Number(jQuery(".input-text.qty").val()) ? Number(jQuery(".input-text.qty").val()) : 1
                }

                if (!productId) {
                    productId = jQuery(event.currentTarget).val()
                }

                // Fallback if the body selector is used
                if (!productId) {
                    // get the product ID from the element that has the class .product
                    // that element will also have an ID that start with product- and ends with the product ID
                    // example: product-123
                    // save the product ID in the variable productId
                    productId = jQuery(".product").attr("id").replace("product-", "")
                }

                wpm.addProductToCart(productId, quantity)
                return
            }

            // If is variable product or variable-subscription
            if (["variable", "variable-subscription"].indexOf(wpmDataLayer.shop.product_type) >= 0) {

                if (quantity === null) {
                    quantity = Number(jQuery(".input-text.qty").val()) ? Number(jQuery(".input-text.qty").val()) : 1
                }

                if (!productId) {
                    productId = jQuery("[name='variation_id']").val()
                }

                wpm.addProductToCart(productId, quantity)
                return
            }

            // If is grouped product
            if (wpmDataLayer.shop.product_type === "grouped") {

                jQuery(".woocommerce-grouped-product-list-item").each((index, element) => {

                    // Can't rely on  event.target.dataset as it always is sent with the parent product ID and the quantity 1

                    quantity = Number(jQuery(element).find(".input-text.qty").val()) ? Number(jQuery(element).find(".input-text.qty").val()) : 1

                    let classes = jQuery(element).attr("class")
                    productId = wpm.getPostIdFromString(classes)

                    wpm.addProductToCart(productId, quantity)
                })
                return
            }

            // If is bundle product
            if (wpmDataLayer.shop.product_type === "bundle") {

                if (quantity === null) {
                    quantity = Number(jQuery(".input-text.qty").val()) ? Number(jQuery(".input-text.qty").val()) : 1
                }

                if (!productId) {
                    productId = jQuery("input[name=add-to-cart]").val()
                }

                wpm.addProductToCart(productId, quantity)
                return
            }

            // everything else
            if (quantity === null) {
                quantity = Number(jQuery(".input-text.qty").val()) ? Number(jQuery(".input-text.qty").val()) : 1
            }

            wpm.addProductToCart(productId, quantity)

        } else {

            if (quantity === null) {
                quantity = 1
            }

            if (!productId) {
                // console.log("add to cart event.currentTarget", event.currentTarget)
                productId = jQuery(event.currentTarget).data("product_id") ? jQuery(event.currentTarget).data("product_id") : null
            }

            // Another fallback to retrieve the product ID in case the ID is saved in the value attribute
            if (!productId) {
                productId = jQuery(event.currentTarget).val() ? jQuery(event.currentTarget).val() : null
            }

            if (
                productId &&
                quantity
            ) {
                wpm.addProductToCart(productId, quantity)
            }
        }

    } catch (e) {
        console.error(e)
    }
})


/**
 * If someone clicks anywhere on a custom /?add-to-cart=123 link
 * trigger the add to cart event
 */

// jQuery(document).one("click", "a:not(.add_to_cart_button, .ajax_add_to_cart, .single_add_to_cart_button)", (event) => {
jQuery("a:not(.add_to_cart_button, .ajax_add_to_cart, .single_add_to_cart_button)").one("click", (event) => {

    try {
        if (jQuery(event.target).closest("a").attr("href")) {

            let url = new URL(jQuery(event.currentTarget).attr("href"), window.location.origin)

            if (url.searchParams.has("add-to-cart")) {

                let productId = url.searchParams.get("add-to-cart")
                wpm.addProductToCart(productId, 1)
            }
        }
    } catch (e) {
        console.error(e)
    }
})

// select item event
// jQuery(document).on("click", ".woocommerce-LoopProduct-link, .wc-block-grid__product, .product, .product-small, .type-product", (event) => {
jQuery(".woocommerce-LoopProduct-link, .wc-block-grid__product, .product, .product-small, .type-product").on("click", (event) => {

    try {

        /**
         * On some pages the event fires multiple times, and on product pages
         * even on page load. Using e.stopPropagation helps to prevent this,
         * but I don't know why. We don't even have to use this, since only a real
         * product click yields a valid productId. So we filter the invalid click
         * events out later down in the code. I'll keep it that way because this is
         * the most compatible way across shops.
         *
         * e.stopPropagation();
         * */

        let productId = jQuery(event.currentTarget).nextAll(".wpmProductId:first").data("id")

        /**
         * On product pages, for some reason, the click event is triggered on the main product on page load.
         * In that case no ID is found. But we can discard it, since we only want to trigger the event on
         * related products, which are found below.
         */

        if (productId) {

            productId = wpm.getIdBasedOndVariationsOutputSetting(productId)

            if (!productId) throw Error("Wasn't able to retrieve a productId")

            if (wpmDataLayer.products && wpmDataLayer.products[productId]) {

                let product = wpm.getProductDetailsFormattedForEvent(productId)

                jQuery(document).trigger("wpmSelectContentGaUa", product)
                jQuery(document).trigger("wpmSelectItem", product)
            }
        }
    } catch (e) {
        console.error(e)
    }
})


// checkout_progress event
// track checkout option event: entered valid billing email
// jQuery(document).on("input", "#billing_email", (event) => {
jQuery("#billing_email").on("input", (event) => {

    if (wpm.isEmail(jQuery(event.currentTarget).val())) {
        // wpm.fireCheckoutOption(2);
        wpm.fireCheckoutProgress(2)
        wpm.emailSelected = true
    }
})


/**
 * Place order button
 *
 * Track checkout option event: purchase click
 * https://stackoverflow.com/a/34112407/4688612
 * jQuery(document).one("click", "#place_order", () => {
 *
 * Has to be hooked after document ready !
 */
jQuery("form.checkout").on("checkout_place_order_success", () => {

    // console log current time
    // console.log("checkout_place_order_success event fired at: " + new Date().getTime())

    if (false === wpm.emailSelected) {
        wpm.fireCheckoutProgress(2)
    }

    if (false === wpm.paymentMethodSelected) {
        wpm.fireCheckoutProgress(3)
        wpm.fireCheckoutOption(3, jQuery("input[name='payment_method']:checked").val())
    }

    wpm.fireCheckoutProgress(4)

    jQuery(document).trigger("wpmPlaceOrder", {})
})

/**
 * Update cart event
 *
 * Has to be hooked after document ready !
 */
jQuery("[name='update_cart']").on("click", () => {

    // console.log("update_cart event fired at: " + new Date().getTime())

    try {
        jQuery(".cart_item").each((index, element) => {

            const productId = wpm.getProductIdByCartItemElement(element)

            if (!productId) {
                console.error("Pixel Manager: Wasn't able to retrieve a productId")
                return
            }

            const quantity = wpm.getProductQuantityByCartItemElement(element)

            if (!quantity) {
                console.error("Pixel Manager: Wasn't able to retrieve a quantity")
                return
            }

            // console.log("productId", productId)
            // console.log("quantity", quantity)

            if (quantity === 0) {
                wpm.removeProductFromCart(productId)
            } else if (quantity < wpmDataLayer.cart[productId].quantity) {
                wpm.removeProductFromCart(productId, wpmDataLayer.cart[productId].quantity - quantity)
            } else if (quantity > wpmDataLayer.cart[productId].quantity) {
                wpm.addProductToCart(productId, quantity - wpmDataLayer.cart[productId].quantity)
            }
        })
    } catch (e) {
        console.error(e)
        wpm.getCartItemsFromBackend()
    }
})

// Supports the following plugins:
// WooCommerce Wishlist: https://woo.com/products/woocommerce-wishlists/
// YITH WooCommerce Wishlist: https://wordpress.org/plugins/yith-woocommerce-wishlist/
// add_to_wishlist
jQuery(".add_to_wishlist,.wl-add-to").on("click", event => {

    try {

        let productId

        if (jQuery(event.currentTarget).data("productid")) { // for the WooCommerce wishlist plugin

            productId = jQuery(event.currentTarget).data("productid")
        } else if (jQuery(event.currentTarget).data("product-id")) { // for the YITH wishlist plugin

            productId = jQuery(event.currentTarget).data("product-id")
        }

        if (!productId) throw Error("Wasn't able to retrieve a productId")

        let product = wpm.getProductDetailsFormattedForEvent(productId)


        jQuery(document).trigger("wpmAddToWishlist", product)
    } catch (e) {
        console.error(e)
    }
})


/**
 * Called when the user selects all the required dropdowns / attributes
 *
 * Has to be hooked after document ready !
 *
 * https://stackoverflow.com/a/27849208/4688612
 * https://stackoverflow.com/a/65065335/4688612
 */

let previousVariationId = null;

jQuery(".single_variation_wrap").on("show_variation", (event, variation) => {
    try {
        let productId = wpm.getIdBasedOndVariationsOutputSetting(variation.variation_id);

        if (!productId) throw Error("Wasn't able to retrieve a productId");

        // If the variation id is not the same as the previous one, run the function
        if (previousVariationId !== variation.variation_id) {
            wpm.triggerViewItemEventPrep(productId);
            previousVariationId = variation.variation_id;
        }

    } catch (e) {
        console.error(e);
    }
});


/**
 * Called on variable products when no selection has been done yet
 * or when the visitor deselects his choice.
 *
 * Has to be hooked after document ready !
 */

// jQuery(function () {
//
// 	jQuery(".single_variation_wrap").on("hide_variation", function () {
//
// 		try {
// 			let classes   = jQuery("body").attr("class")
// 			let productId = classes.match(/(postid-)(\d+)/)[2]
//
// 			if (!productId) throw Error("Wasn't able to retrieve a productId")
//
// 			/**
// 			 * If we have a variable product with no preset,
// 			 * and variations output is enabled,
// 			 * then we send a viewItem event with the first
// 			 * variation we find for the parent.
// 			 * If variations output is disabled,
// 			 * we just send the parent ID.
// 			 *
// 			 * And if Facebook microdata is active, use the
// 			 * microdata product ID.
// 			 */
//
// 			if (
// 				"variable" === wpmDataLayer.shop.product_type &&
// 				wpmDataLayer?.shop?.variations_output
// 			) {
// 				for (const [key, product] of Object.entries(wpmDataLayer.products)) {
// 					if ("parent_id" in product) {
//
// 						productId = product.id
// 						break
// 					}
// 				}
//
// 				if (wpmDataLayer?.pixels?.facebook?.microdata_product_id) {
// 					productId = wpmDataLayer.pixels.facebook.microdata_product_id
// 				}
// 			}
//
// 			// console.log("hmm")
// 			wpm.triggerViewItemEventPrep(productId)
//
// 		} catch (e) {
// 			console.error(e)
// 		}
// 	})
// })

// jQuery(function () {
//
// 	jQuery(".single_variation_wrap").on("hide_variation", function () {
// 		jQuery(document).trigger("wpmviewitem")
// 	})
// })