/**
 * Load Google Ads functions
 * */

(function(wpm, $, undefined) {


    wpm.getGoogleAdsConversionIdentifiersWithLabel = () => {

        let conversionIdentifiers = []

        if (wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds) {
            Object.entries(wpmDataLayer.pixels.google.ads.conversionIds).forEach(([key, item]) => {
                if (item) {
                    conversionIdentifiers.push(key + "/" + item)
                }
            })
        }

        return conversionIdentifiers
    }

    wpm.getGoogleAdsConversionIdentifiers = () => {

        let conversionIdentifiers = []

        Object.keys(wpmDataLayer.pixels.google.ads.conversionIds).forEach((key) => {
            conversionIdentifiers.push(key)
        })

        return conversionIdentifiers
    }

    wpm.getGoogleAdsRegularOrderItems = () => {

        let orderItems = []

        Object.values(wpmDataLayer.order.items).forEach((item) => {

            let orderItem

            orderItem = {
                quantity: item.quantity,
                price: item.price,
                google_business_vertical: wpmDataLayer.pixels.google.ads.google_business_vertical,
            }

            if (wpmDataLayer ? .shop ? .variations_output && 0 !== item.variation_id) {

                orderItem.id = String(wpmDataLayer.products[item.variation_id].dyn_r_ids[wpmDataLayer.pixels.google.ads.dynamic_remarketing.id_type])
                orderItems.push(orderItem)
            } else {

                orderItem.id = String(wpmDataLayer.products[item.id].dyn_r_ids[wpmDataLayer.pixels.google.ads.dynamic_remarketing.id_type])
                orderItems.push(orderItem)
            }
        })

        return orderItems
    }

}(window.wpm = window.wpm || {}, jQuery))