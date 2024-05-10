(function(wpm, $, undefined) {

    wpm.jQueryExists = async () => new Promise(resolve => {

        (function waitForjQuery() {
            if (typeof jQuery !== "undefined") return resolve()
            setTimeout(waitForjQuery, 100)
        })()
    })

    wpm.waitForLibrary = (library, timeout = 5000, interval = 100) => {

        const startTime = Date.now()
        while (typeof window[library] === "undefined") {
            // Check if timeout in milliseconds has passed
            if (Date.now() - startTime > timeout) {
                break // Maximum wait time reached, exit the loop
            }
            // Wait for the interval in milliseconds before checking again
            setTimeout(() => {}, interval)
        }
    }

    wpm.wpmDataLayerFullyLoaded = async () => {

        // Promise that checks if the nested object wpmDataLayer.version is defined.
        // If so, resolve.
        // We must check for the nested object wpmDataLayer.version,
        // because the wpmDataLayer object can be defined early by adding products to the data layer through
        // template inline scripts. So we need to wait until the wpmDataLayer configuration objects
        // are defined.
        let checkVar = new Promise((resolve) => {
            (function waitForVar() {
                if (
                    typeof wpmDataLayer !== "undefined" &&
                    typeof wpmDataLayer.version !== "undefined"
                ) {
                    return resolve()
                }
                setTimeout(waitForVar, 100)
            })()
        })

        // Set a timeout to log a message after 6 seconds
        let logTimeoutId = setTimeout(() => {
            console.error("Pixel Manager error: The wpmDataLayer is not defined. Please make sure that the wpmDataLayer script snippet is inserted and not modified by any third-party plugin, such as a consent management platform or a JavaScript optimizer.")

        }, 6000)

        checkVar.then(() => {
            clearTimeout(logTimeoutId)
        })

        return checkVar
    }

    wpm.wpHooksExists = async () => new Promise(resolve => {
        (function waitForVar() {

            // Resolve if wp.hooks is defined
            if (typeof wp !== "undefined" && typeof wp.hooks !== "undefined") return resolve()
            setTimeout(waitForVar, 50)
        })()
    })

    /**
     * Load all WooCommerce hooks functions
     *
     * Includes safeguard in case the user changed the default load order for wp-hooks, or removed it completely.
     *
     * @returns {Promise<void>}
     */
    wpm.loadWcHooksFunctions = async () => {
        // Load all WooCommerce Blocks hooks
        await wpm.wpHooksExists()
        require("./wc_hooks")
    }

}(window.wpm = window.wpm || {}, jQuery))