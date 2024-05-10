/**
 * Load Google base functions
 */

(function(wpm, $, undefined) {

    wpm.googleConfigConditionsMet = (type = null) => {

        // Always returns true if Google Consent Mode is active
        if (wpmDataLayer ? .pixels ? .google ? .consent_mode ? .is_active) {
            return true
        }

        // If a type is passed, return true if the user has given consent to that type
        // or false if the user has not given consent to that type.
        if (type) {
            return !!wpm.consent.categories.get()[type]
        }

        // If no type is passed, return true if the user has given consent to the statistics or marketing categories.
        if (!!(wpm.consent.categories.get().marketing || wpm.consent.categories.get().statistics)) {
            // console.log("User has given consent to the statistics or marketing categories. Google can load.")
            return true
        }

        return false
    }

    wpm.fireGtagGoogleAds = () => {
        try {
            wpmDataLayer.pixels.google.ads.state = "loading"

            if (wpmDataLayer ? .pixels ? .google ? .ads ? .enhanced_conversions ? .active) {
                Object.keys(wpmDataLayer.pixels.google.ads.conversionIds).forEach((key) => {
                    gtag("config", key, {
                        "allow_enhanced_conversions": true
                    })
                })
            } else {
                Object.keys(wpmDataLayer.pixels.google.ads.conversionIds).forEach((key) => {
                    gtag("config", key)
                })
            }

            if (wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds && wpmDataLayer ? .pixels ? .google ? .ads ? .phone_conversion_label && wpmDataLayer ? .pixels ? .google ? .ads ? .phone_conversion_number) {
                gtag("config", Object.keys(wpmDataLayer.pixels.google.ads.conversionIds)[0] + "/" + wpmDataLayer.pixels.google.ads.phone_conversion_label, {
                    phone_conversion_number: wpmDataLayer.pixels.google.ads.phone_conversion_number,
                })
            }

            // https://support.google.com/google-ads/answer/9888145#zippy=%2Cvalidate-your-implementation-using-chrome-developer-tools
            if (
                wpmDataLayer ? .shop ? .page_type &&
                "order_received_page" === wpmDataLayer.shop.page_type &&
                wpmDataLayer ? .order ? .google ? .ads ? .enhanced_conversion_data
            ) {
                gtag("set", "user_data", wpmDataLayer.order.google.ads.enhanced_conversion_data)
            }

            wpmDataLayer.pixels.google.ads.state = "ready"
        } catch (e) {
            console.error(e)
        }
    }

    // https://developers.google.com/tag-platform/gtagjs/reference
    wpm.fireGtagGoogleAnalyticsGA4 = () => {

        try {
            wpmDataLayer.pixels.google.analytics.ga4.state = "loading"

            let parameters = wpmDataLayer.pixels.google.analytics.ga4.parameters

            if (wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .debug_mode) {
                parameters.debug_mode = true
            }

            gtag("config", wpmDataLayer.pixels.google.analytics.ga4.measurement_id, parameters)

            wpmDataLayer.pixels.google.analytics.ga4.state = "ready"
        } catch (e) {
            console.error(e)
        }
    }

    /**
     * Check if Google is active
     *
     * @returns {boolean}
     */
    wpm.isGoogleActive = () => {

        // If GA4 is active, return true
        if (wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) return true

        // If Google Ads is active, return true
        if (!jQuery.isEmptyObject(wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds)) return true

        return false
    }

    wpm.getGoogleGtagId = () => {

        if (wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) {
            return wpmDataLayer.pixels.google.analytics.ga4.measurement_id
        }

        if (
            wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds &&
            Object.keys(wpmDataLayer.pixels.google.ads.conversionIds)[0]
        ) {
            return Object.keys(wpmDataLayer.pixels.google.ads.conversionIds)[0]
        }

        if (wpmDataLayer ? .pixels ? .google ? .analytics ? .universal ? .property_id) {
            console.log("UA analytics ID")
            return wpmDataLayer.pixels.google.analytics.universal.property_id
        }

        return ""
    }


    wpm.loadGoogle = () => {

        if (!wpm.isGoogleActive()) {
            return
        }

        wpmDataLayer.pixels.google.state = "loading"

        wpm.loadScriptAndCacheIt("https://www.googletagmanager.com/gtag/js?id=" + wpm.getGoogleGtagId())
            .then((script, textStatus) => {

                try {

                    // If Google TCF is active, output the TCF script
                    // https://developers.google.com/tag-platform/security/guides/implement-TCF-strings
                    if (wpmDataLayer ? .pixels ? .google ? .tcf_support) {
                        window["gtag_enable_tcf_support"] = true
                    }

                    // Initiate Google dataLayer and gtag
                    window.dataLayer = window.dataLayer || []

                    window.gtag = function gtag() {

                        wpm.consoleLog("gtag called with", arguments)
                        pmw.consent.api.processExternalGcmConsentUpdate(arguments)

                        // Delete the source property from the arguments object
                        // It is a helper property that is not needed by gtag for regular calls
                        if (arguments.length === 3 && arguments[2] ? .source) {
                            delete arguments[2].source
                        }

                        dataLayer.push(arguments)
                    }

                    // Google Consent Mode
                    if (wpmDataLayer ? .pixels ? .google ? .consent_mode ? .is_active) {

                        let google_consent_settings = {
                            ad_personalization: wpm.consent.categories.get().marketing ? "granted" : "denied",
                            ad_storage: wpm.consent.categories.get().marketing ? "granted" : "denied",
                            ad_user_data: wpm.consent.categories.get().marketing ? "granted" : "denied",
                            analytics_storage: wpm.consent.categories.get().statistics ? "granted" : "denied",
                            functionality_storage: wpm.consent.categories.get().preferences ? "granted" : "denied",
                            personalization_storage: wpm.consent.categories.get().preferences ? "granted" : "denied",
                            security_storage: wpm.consent.categories.get().necessary ? "granted" : "denied",
                            wait_for_update: wpmDataLayer.pixels.google.consent_mode.wait_for_update,
                        }

                        if (wpmDataLayer ? .pixels ? .google ? .consent_mode ? .region) {
                            google_consent_settings.region = wpmDataLayer.pixels.google.consent_mode.region
                        }

                        wpm.consoleLog("Google Consent Mode settings", google_consent_settings)

                        gtag("consent", "default", google_consent_settings)
                        gtag("set", "ads_data_redaction", wpmDataLayer.pixels.google.consent_mode.ads_data_redaction)
                        gtag("set", "url_passthrough", wpmDataLayer.pixels.google.consent_mode.url_passthrough)
                    }

                    // Google Linker
                    // https://developers.google.com/gtagjs/devguide/linker
                    if (wpmDataLayer ? .pixels ? .google ? .linker ? .settings) {
                        gtag("set", "linker", wpmDataLayer.pixels.google.linker.settings)
                    }

                    gtag("js", new Date())
                    gtag("set", "developer_id.dNDI5Yz", true)

                    // Google Ads loader
                    if (!jQuery.isEmptyObject(wpmDataLayer ? .pixels ? .google ? .ads ? .conversionIds)) { // Only run if the pixel has set up
                        if (wpm.googleConfigConditionsMet("marketing")) { // Only run if cookie consent has been given
                            wpm.fireGtagGoogleAds()
                        } else {
                            wpm.consent.logSuppressedPixel("marketing", "Google Ads")
                        }
                    }

                    // GA4 loader
                    if (wpmDataLayer ? .pixels ? .google ? .analytics ? .ga4 ? .measurement_id) { // Only run if the pixel has set up

                        if (wpm.googleConfigConditionsMet("statistics")) { // Only run if cookie consent has been given
                            wpm.fireGtagGoogleAnalyticsGA4()
                        } else {
                            wpm.consent.logSuppressedPixel("statistics", "GA4")
                        }
                    }

                    wpmDataLayer.pixels.google.state = "ready"

                    wpm.triggerQueuedEvents("gtag")

                } catch (e) {
                    console.error(e)
                }
            })
    }

    wpm.gtagLoaded = () => {
        return new Promise((resolve, reject) => {

            if (typeof wpmDataLayer ? .pixels ? .google ? .state === "undefined") reject()

            let startTime = 0
            let timeout = 5000
            let frequency = 200;

            (function wait() {
                if (wpmDataLayer ? .pixels ? .google ? .state === "ready") return resolve()
                if (startTime >= timeout) {
                    wpm.consoleError("Google gtag failed to load. Probably a third party script is blocking it.")
                    return reject()
                }
                startTime += frequency
                setTimeout(wait, frequency)
            })()
        })
    }


}(window.wpm = window.wpm || {}, jQuery))