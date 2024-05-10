/**
 * Load all PMW functions
 *
 * Ignore event listeners. They need to be loaded after
 * we made sure that jQuery has been loaded.
 */

require("./functions")

window.wpm.consent = require("./consent/consent.mjs")

window.pmw = {
    consent: {
        api: require("./consent/api.mjs"),
        // scripts: require("./consent/scripts.mjs"),
    }
}

require("./ip_services")

// #if process.env.TIER === 'premium'
// if (wpm.canLoadPremiumFeatures()) {
// 	require("./functions_premium")
// }
// #endif