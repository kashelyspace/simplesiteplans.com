/**
 * Consent Management
 **/

/**
 * Load modules
 */
import cmps from "./cmps.mjs"

/**
 * Initialize and set default values
 */
export let settings = {
	categories      : {
		statistics : true,
		marketing  : true,
		preferences: true,
		necessary  : true, // Necessary cookies are always allowed
	},
	visitorHasChosen: false,

	get: (data = null) => {

		if (data === null) {
			return settings
		}

		let result = {}

		for (let key of data) {
			result[key] = settings[key]
		}

		return result
	},

	set: (data) => {
		for (let key in data) {
			settings[key] = data[key]
		}
	},
}

/**
 * Load the consent management
 *
 * @returns {Promise<void>}
 * @public
 */
export const load = async () => {

	/** Load the event listeners for each CMP */
	loadCmpEventListeners()

	/** Set the default values */
	// console.log("setDefaultValues")
	setExplicitConsentModeDefaults()

	/**
	 * Get the consent values from the cookies
	 * */

	loadConsentFromCmps()

	/** Unlocks countries in allowed regions */
	await countryUnlock()

	/** Update the pixel consent for pixel type CMPs */
	// wpm.scriptTagObserver.observe(document.head, {childList: true, subtree: true})
	// jQuery(document).on("DOMContentLoaded", () => wpm.scriptTagObserver.disconnect())

	/** Trigger the consent management loaded event */
	loadTrigger()
}

const loadConsentFromCmps = () => {
	let cmpConsent = getConsentFromCmps()

	if (cmpConsent) {
		wpm.consent.categories.set(cmpConsent)
		wpm.consent.settings.set({visitorHasChosen: true})
	}
}

/**
 * Load the event listeners for each CMP
 *
 * @returns {void}
 * @private
 */
const loadCmpEventListeners = () => {
	for (let cmp of cmps) {

		if (typeof cmp.loadEventListeners !== "function") {
			continue
		}
		cmp.loadEventListeners()
	}
}

/**
 * Set the default values
 *
 * @returns {void}
 * @private
 */
const setExplicitConsentModeDefaults = () => {

	/**
	 * Setup defaults
	 *
	 * TODO: Extend with country specific settings.
	 *
	 * If explicit consent mode is active,
	 * and no consent has been given yet,
	 * and there are regions set in the settings,
	 * then set the consent values accordingly.
	 * (if a country is set then only set the consent to false if the visitor is from that country)
	 * Otherwise set the consent values to false.
	 */

	let explicitConsent = !wpm.consent.explicitConsentModeActive()

	wpm.consent.categories.set({
		statistics : explicitConsent,
		marketing  : explicitConsent,
		preferences: explicitConsent,
		necessary  : true,
	})
}

/**
 * Check if PMW is in explicit consent mode
 *
 * @returns {boolean}
 * @private
 */
export const explicitConsentModeActive = () => wpmDataLayer?.general?.cookie_consent_mgmt?.explicit_consent

/**
 * Returns the consent values
 *
 * @returns any
 * @public
 * */
wpm.getConsentValues = () => wpm.consent.settings.get()

/**
 * Set the consent values
 *
 * @param {Object} consentValues
 * @param {boolean} consentValues.statistics
 * @param {boolean} consentValues.marketing
 * @param {boolean} consentValues.preferences
 * @param {boolean} consentValues.necessary
 *
 * @returns {void}
 * @public
 */
// export const setCategories = ({statistics, marketing, preferences, necessary}) => {
export const categories = {

	set: ({
			  statistics = wpm.consent.settings.get().statistics,
			  marketing = wpm.consent.settings.get().marketing,
			  preferences = wpm.consent.settings.get().preferences,
			  necessary = wpm.consent.settings.get().necessary,
		  }) => {
		settings.categories.statistics  = statistics
		settings.categories.marketing   = marketing
		settings.categories.preferences = preferences
		settings.categories.necessary   = necessary
	},

	get: (data = null) => {

		if (data === null) {
			return settings.categories
		}

		let result = {}

		for (let key of data) {
			result[key] = settings.categories[key]
		}

		return result
	},
}

/**
 * Get the consent values from various cookies
 *
 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean} | null}
 * - statistics: Boolean - Indicates if consent has been given for statistics cookies
 * - marketing: Boolean - Indicates if consent has been given for marketing cookies
 * - preferences: Boolean - Indicates if consent has been given for preference cookies
 * - necessary: Boolean - Indicates if consent has been given for necessary cookies
 * @private
 */
const getConsentFromCmps = () => {

	/**
	 * PMW Cookie Consent
	 *
	 * The PMW only saves the pmw_cookie_consent if the API is used.
	 * This means that always the CMP cookie is read first, unless:
	 * - Our CMP event listeners has been triggered and use our API to set the new consent values.
	 * - A CMP decides to start using our API. (then their cookie will be ignored.
	 *   This is especially useful for Borlabs and RCB where we use truethy values for consent.
	 *
	 * TODO: Maybe store in PMW's data store. However, we can't set a duration there. Store in the data store if no duration is needed.
	 */

	const storageKey = "pmw_cookie_consent"

	let consent = wpm.retrieveData(storageKey, true) || wpm.getCookie(storageKey)

	if (consent) {
		return typeof consent === "object" ? consent : JSON.parse(consent)
	}

	/**
	 * Get the consent values from the CMPs
	 */
	for (let cmp of cmps) {

		if (typeof cmp.getConsent !== "function") {
			continue
		}

		let consent = cmp.getConsent()

		if (!consent) {
			continue
		}

		return consent
	}

	return null
}

/**
 * TODO: Extend with country specific settings.
 *
 * Unlock countries in allowed regions
 *
 * If explicit consent mode is active,
 * and no consent has been given yet,
 * and there are regions set in the settings,
 * then set the consent values accordingly.
 * If a country is set then only set the consent to false
 * if the visitor is from that country.
 * Otherwise set the consent values to true.
 *
 * @returns {Promise<void>}
 * @private
 *
 * TODO: Verify all the conditions and calls
 */
const countryUnlock = async () => {

	// Return if explicit consent mode is not active
	if (!explicitConsentModeActive()) return
	// console.log("countryUnlock explicit_consent", isPmwInExplicitConsentMode)

	// Return if the visitor has already chosen
	if (wpm.consent.settings.get().visitorHasChosen) return
	// console.log("countryUnlock visitorHasChosen", wpmConsentValues.visitorHasChosen)

	// Return if there are no regions set in the settings
	if (!wpmDataLayer?.pixels?.google?.consent_mode?.region) return
	// console.log("countryUnlock regions", wpmDataLayer.pixels.google.consent_mode.region)

	const browserCountry = await wpm.getBrowserCountry()

	// If the country is in the list of restricted countries, then set the consent values to false
	// else set the consent values to true

	if (
		wpmDataLayer?.pixels?.google?.consent_mode?.region.includes(browserCountry)
		|| browserCountry === "unknown"
	) {

		wpm.consoleLog(`The country ${browserCountry} is in the list of restricted countries. Set the consent values to false and block the pixels.`)
		wpm.consent.categories.set({statistics: false, marketing: false, preferences: false, necessary: true})
		return
	}

	wpm.consoleLog(`The country ${browserCountry} is not in the list of restricted countries. Set the consent values to true and fire the pixels.`)
	wpm.consent.categories.set({statistics: true, marketing: true, preferences: true, necessary: true})
}

/**
 *
 * TODO: Remove pixel based features once support for Borlabs and Real Cookie Banner is fully dropped
 */
export const canPixelBeFired = (category, pixelName) => {

	if (wpm.consent.categories.get()[category]) {
		wpm.consoleLog(`The category ${category} has been approved. Loading the ${pixelName} pixel.`)
		return true
	}

	logSuppressedPixel(category, pixelName)
	return false
}

export const logSuppressedPixel = (category, pixelName) => {

	let mode = explicitConsentModeActive() ? "explicit" : "implicit"

	console.log(`Pixel Manager: The pixel has not loaded because you have not given consent for it yet. - mode: ${mode}, category: ${category}, pixel: ${pixelName}`)
}

/**
 * Update the Google Consent Mode
 *
 * @param statistics
 * @param marketing
 * @param preferences
 * @param necessary
 */
export const updateGoogleConsentMode = ({
											statistics = wpm.consent.categories.get().statistics,
											marketing = wpm.consent.categories.get().marketing,
											preferences = wpm.consent.categories.get().preferences,
											necessary = wpm.consent.categories.get().necessary,
										}) => {

	try {
		if (!window.gtag) return

		let data = {
			analytics_storage      : statistics ? "granted" : "denied",
			ad_storage             : marketing ? "granted" : "denied",
			ad_user_data           : marketing ? "granted" : "denied",
			ad_personalization     : marketing ? "granted" : "denied",
			functionality_storage  : preferences ? "granted" : "denied",
			personalization_storage: preferences ? "granted" : "denied",
			security_storage       : necessary ? "granted" : "denied",
			source                 : "pmw",
		}

		gtag("consent", "update", data)
		wpm.consoleLog("Google consent mode updated", data)
	} catch (e) {
		console.error(e)
	}
}


/**
 * Trigger the consent management loaded event
 *
 * @returns {void}
 * @private
 */
const loadTrigger = () => {

	// Trigger an event once the PMW consent management has been loaded
	document.dispatchEvent(new Event("pmw_cookie_consent_management_loaded"))
	document.dispatchEvent(new Event("pmwCookieConsentManagementLoaded"))

	wpm.consoleLog("consent category settings: ", wpm.consent.categories.get())
}

/**
 * Reload the page when the user clicks a cosent button
 *
 * @param ids
 * @param classes
 * @returns {void}
 * @public
 */
export const cmpConsentClickObserver = ({ids = [], classes = []}) => {

	// if buttonClasses don't have a dot in front of them, add it
	classes = classes.map(buttonClass => buttonClass.startsWith(".") ? buttonClass : "." + buttonClass)

	const observer = new MutationObserver((mutationsList, observer) => {
		// Look through all mutations that just occured
		for (let mutation of mutationsList) {
			// If the addedNodes property has one or more nodes
			if (mutation.addedNodes.length) {

				if (classes.length > 0) {

					const elements = document.querySelectorAll(classes.join(", "))

					elements.forEach(element => {
						element.addEventListener("click", () => {
							location.reload()
						})
						observer.disconnect()
					})
				}

				if (ids.length > 0) {

					ids.forEach(buttonId => {
						const button = document.getElementById(buttonId)
						if (button) {
							button.addEventListener("click", () => {
								location.reload()
							})
							// Once we have added the click event listener, there's no need to observe anymore
							observer.disconnect()
						}
					})
				}
			}
		}
	})

	observer.observe(document.body, {childList: true, subtree: true})
}
