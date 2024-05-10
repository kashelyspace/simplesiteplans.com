/**
 * Run PMW main loader
 */
import {
    loadDeprecatedFunctions
} from "./wpm/deprecated.mjs"

const main = async () => {

    require("./wpm/functions_main")
    require("./version.js")

    // Wait until jQuery is loaded
    await wpm.jQueryExists()

    // Wait until wpmDataLayer is loaded
    await wpm.wpmDataLayerFullyLoaded()

    // wait 1000ms
    // await new Promise(resolve => setTimeout(resolve, 1000))

    // Load all essential scripts first
    require("./wpm/functions_loader")

    // Output PMW console message
    wpm.pmwConsoleMessage()

    // Load the consent management module
    await wpm.consent.load()

    // Load all event listeners that depend on document ready
    jQuery(document).on("pmw:ready", () => {
        require("./wpm/event_listeners_on_ready")
    })

    // Load remaining event listeners
    require("./wpm/event_listeners")

    wpm.loadWcHooksFunctions()

    // Check if domain is excluded from tracking
    // If so, return
    if (wpm.excludeDomainFromTracking()) return

    // Load free pixels
    require("./google/loader")
    require("./facebook/loader")
    require("./hotjar/loader")

    // #if process.env.TIER === 'premium'
    // 	/**
    // 	 *  Load all premium scripts
    // 	 */
    // 	if (wpm.canLoadPremiumFeatures()) {
    // 		require("./wpm/event_listeners_premium")
    // 		require("./adroll/loader")
    // 		require("./linkedin/loader")
    // 		require("./microsoft-ads/loader")
    // 		require("./outbrain/loader")
    // 		require("./pinterest/loader")
    // 		require("./snapchat/loader")
    // 		require("./taboola/loader")
    // 		require("./tiktok/loader")
    // 		require("./twitter/loader")
    // 		require("./reddit/loader")
    // 		require("./vwo/loader")
    // 	}
    // #endif

    /** Load the deprecated functions */
    loadDeprecatedFunctions()

    // Preload pixels
    document.dispatchEvent(new Event("pmwLoadPixels"))

    // Trigger wpmLoad event
    document.dispatchEvent(new Event("wpmLoad"))

    // Wait until page is loaded
    await wpm.pageLoaded()
    wpm.triggerDomReadyEvent()

    // Check if the library version matches the PMW version that's installed on the server
    wpm.checkLibraryVersion()
}

main()