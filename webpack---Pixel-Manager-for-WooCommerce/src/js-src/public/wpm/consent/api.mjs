/**
 * Pixel Manager Cookie Consent API
 **/

/**
 * Accept consent for all cookies
 *
 * @param duration {number|null}
 * @returns {void}
 * @public
 */
export const acceptAll = ({duration = null} = {}) => {

	const data = {
		statistics : true,
		marketing  : true,
		preferences: true,
		necessary  : true,
		duration   : duration,
	}

	saveState(data)
	loadApprovedPixels()
	wpm.consent.updateGoogleConsentMode(data)
}

/**
 * Revoke consent for all cookies
 *
 * @param duration {number|null}
 * @returns {void}
 * @public
 */
export const revokeAll = ({duration = null} = {}) => {

	const data = {
		statistics : false,
		marketing  : false,
		preferences: false,
		necessary  : true,
		duration   : duration,
	}

	saveState(data)
	wpm.consent.updateGoogleConsentMode(data)
}

/**
 * Accept consent selectively
 *
 * @param statistics
 * @param marketing
 * @param preferences
 * @param necessary
 * @param duration
 * @returns {void}
 * @public
 */
export const updateSelectively = ({
									  statistics = wpm.consent.categories.get().statistics,
									  marketing = wpm.consent.categories.get().marketing,
									  preferences = wpm.consent.categories.get().preferences,
									  necessary = wpm.consent.categories.get().necessary,
									  duration = null,
								  }) => {

	if (statistics === undefined || marketing === undefined || preferences === undefined || necessary === undefined) {
		console.log("pmw.consent.api.updateSelectively: It is recommended to pass all consent types. - statistics, marketing, preferences")
	}

	let data = {
		statistics,
		marketing,
		preferences,
		necessary,
		duration,
	}

	saveState(data)
	loadApprovedPixels()
	wpm.consent.updateGoogleConsentMode(data)
	wpm.consoleLog("consent category settings", data)
}

/**
 * Set a cookie called pmw_cookie_consent with the value of pmw_cookie_consent
 * and set the default expiration date to 1 year from now.
 *
 * @param statistics {boolean}
 * @param marketing {boolean}
 * @param preferences {boolean}
 * @param necessary {boolean}
 * @param duration {number|null}
 *
 * @returns {void}
 * @private
 *
 * TODO: Use the data store
 * TODO: Cleanup
 */
const setConsentCookie = ({statistics, marketing, preferences, necessary, duration = null}) => {

	const key  = "pmw_cookie_consent"
	const data = {statistics, marketing, preferences, necessary}

	// If no duration is set, use the wpm storage,
	// otherwise use wpm.setCookie()
	if (duration === null) {
		wpm.storeData(key, data, true)
		return
	}

	wpm.setCookie("pmw_cookie_consent", JSON.stringify(data), duration)
}

const loadApprovedPixels = () => {
	document.dispatchEvent(new Event("pmwLoadPixels"))
}

/**
 * Save the consent in the settings and set the cookie
 *
 * @param data
 * @returns {void}
 * @private
 */
const saveState = (data) => {
	wpm.consent.categories.set(data)
	setConsentCookie(data)
}

/**
 * Process the consent update from the external source
 *
 * @param attributes
 * @returns {void}
 * @public
 */
export const processExternalGcmConsentUpdate = (attributes) => {

	if (attributes[0] !== "consent") return
	if (attributes[1] !== "update") return
	if (attributes[2]?.source === "pmw") return

	wpm.consoleLog("processExternalGcmConsentUpdate", attributes)

	let previousData = wpm.consent.categories.get()

	let data = {
		statistics : attributes[2].analytics_storage !== undefined ? attributes[2].analytics_storage === "granted" : previousData.statistics,
		marketing  : attributes[2].ad_storage !== undefined ? attributes[2].ad_storage === "granted" : previousData.marketing,
		preferences: (attributes[2].functionality_storage !== undefined ? attributes[2].functionality_storage === "granted" : previousData.preferences) ||
			(attributes[2].personalization_storage !== undefined ? attributes[2].personalization_storage === "granted" : previousData.preferences),
		necessary  : attributes[2].security_storage !== undefined ? attributes[2].security_storage === "granted" : previousData.necessary,
	}

	saveState(data)
	loadApprovedPixels()
}

