/**
 * https://github.com/woocommerce/woocommerce-blocks/blob/trunk/src/BlockTypes/AbstractProductGrid.php#L108
 * https://github.com/woocommerce/woocommerce-blocks/issues/3483
 * https://github.com/woocommerce/woocommerce-blocks/issues/1714
 *
 * https://github.com/woocommerce/woocommerce-blocks/blob/trunk/docs/third-party-developers/extensibility/hooks/actions.md#woocommerce_add_to_cart
 *
 * https://github.com/woocommerce/woocommerce-blocks/blob/trunk/docs/internal-developers/blocks/feature-flags-and-experimental-interfaces.md
 * https://github.com/woocommerce/woocommerce-blocks/blob/trunk/docs/internal-developers/blocks/feature-flags-and-experimental-interfaces.md#usages-of-experimental-prefix
 *
 * experimental__woocommerce_blocks-product-list-render
 *
 * https://github.com/woocommerce/woocommerce-blocks/blob/a1a6eb2b574b7d39d19d67bafb747d38017289da/docs/internal-developers/blocks/feature-flags-and-experimental-interfaces.md/#usages-of-experimental-prefix
 */

// TODO experimental__woocommerce_blocks-checkout-set-email-address
// TODO experimental__woocommerce_blocks-product-view-link > selectItem
// TODO maybe experimental__woocommerce_blocks-product-list-render, when product list is rendered send some list event
// TODO maybe experimental__woocommerce_blocks-product-search, if the current event trigger doesn't work
// TODO experimental__woocommerce_blocks-product-render > viewItem
// TODO various events during entering checkout details, such as email, address, etc.
// TODO find a way to keep view_item_list events working with the mutation observer

// import {createHooks, addAction, doAction} from "@wordpress/hooks"
// console.log(wp.hooks)
// console.log(wp.hooks.applyFilters("ndx_change_string", ""))

/**
 * Add-to-cart button
 */
wp.hooks.addAction(
    "experimental__woocommerce_blocks-cart-add-item",
    "pixel-manager-for-woocommerce",
    data => {
        // console.log("experimental__woocommerce_blocks-cart-add-item", data)

        // Works on the all product page
        // TODO make it work with variable quantities on product page
        wpm.addProductToCart(data.product.id, 1)
    },
)

/**
 * Change cart quantity
 */
wp.hooks.addAction(
    "experimental__woocommerce_blocks-cart-set-item-quantity",
    "pixel-manager-for-woocommerce",
    data => {
        // console.log("experimental__woocommerce_blocks-cart-set-item-quantity", data)

        if (data.quantity > data.product.quantity) {
            wpm.addProductToCart(data.product.id, data.quantity - data.product.quantity)
        }

        if (data.quantity < data.product.quantity) {
            wpm.removeProductFromCart(data.product.id, data.product.quantity - data.quantity)
        }
    },
)

/**
 * Remove from cart
 */
wp.hooks.addAction(
    "experimental__woocommerce_blocks-cart-remove-item",
    "pixel-manager-for-woocommerce",
    data => {
        // console.log("experimental__woocommerce_blocks-cart-remove-item", data)
        wpm.removeProductFromCart(data.product.id, data.quantity)
    },
)

/**
 * Start checkout
 */

// wp.hooks.addAction(
// 	"experimental__woocommerce_blocks-checkout-render-checkout-form",
// 	"pixel-manager-for-woocommerce",
// 	data => {
// 		console.log("experimental__woocommerce_blocks-checkout-render-checkout-form", data)
// 		jQuery(document).trigger("wpmBeginCheckout")
// 	},
// )

/**
 * Checkout form submit
 */
wp.hooks.addAction(
    "experimental__woocommerce_blocks-checkout-submit",
    "pixel-manager-for-woocommerce",
    () => {
        // console.log("experimental__woocommerce_blocks-checkout-submit")
        jQuery(document).trigger("wpmPlaceOrder", {})
    },
)


/**
 * Only outputs an object with products. No other data or actions.
 */
// wp.hooks.addAction(
// 	"experimental__woocommerce_blocks-product-list-render",
// 	"pixel-manager-for-woocommerce",
// 	(value) => {
//
// 		if (value.products.length > 0) {
// 			console.log("hello world 1")
// 			console.log(value)
//
// 			jQuery(".add_to_cart_button").on("click", function (event) {
//
// 				console.log(jQuery(event.target.parentElement.parentElement))
//
// 				// console.log("hello world 5");
// 				//
// 				// console.log(jQuery(this.parentElement.parentElement));
// 				//
// 				// console.log("hello world 6");
// 				//
// 				// // element is part of a React component.
// 				// // Get the parent element.
// 				// const pe = event.target.parentElement.parentElement
// 				// console.log(jQuery(pe)._reactInternalFiber.key)
// 				//
// 				// // pe is a react component. Get the key of that component.
// 				// const key = pe.getAttribute("data-key")
// 				// console.log(key)
//
//
// 				// console.log(element.currentTarget.dataset.key)
// 			})
// 		}
// 		return value
// 	},
// )

// jQuery(document).on("pmw:ready", () => {
// 	jQuery(".add_to_cart_button").on("click", function (element) {
//
// 		console.log("hello world 3")
// 		// element is part of a React component.
// 		// Get the key of that component.
// 		console.log(element.currentTarget.dataset.key)
// 	})
// })

// wp.hooks.addAction(
// 	'woocommerce_add_to_cart',
// 	'pixel-manager-for-woocommerce',
// 	( cart_item_key, product_id, quantity, variation_id, variation, cart_item_data ) => {
// 		console.log( cart_item_key, product_id, quantity, variation_id, variation, cart_item_data );
// 	},
// 	()=>{
// 		console.log("hello world 2")
// 	}
// )

/**
 * Product Search
 *
 * TODO: Make sure that it doesn't duplicate the event
 */
// wp.hooks.addAction(
// 	"experimental__woocommerce_blocks-product-search",
// 	"pixel-manager-for-woocommerce",
// 	data => {
// 		// console.log("experimental__woocommerce_blocks-product-search", data)
// 		jQuery(document).trigger("pmwEvent:Search", data.searchTerm)
// 	},
// )