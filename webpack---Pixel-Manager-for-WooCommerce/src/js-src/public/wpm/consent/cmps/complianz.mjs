/**
 * Complianz Cookie
 * https://wordpress.org/plugins/complianz-gdpr/
 *
 * TODO: Inform the developers. The event listener fires four times and has inconsistent data. As a consequence PMW has to update the consent status also four times which is inefficient.
 */

export const complianz = {

	/**
	 * Get the Complianz cookies
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		// console.log("getComplianzCookies")

		let cmplz_statistics     = wpm.getCookie("cmplz_statistics") || wpm.getCookie("cmplz_rt_statistics")
		let cmplz_marketing      = wpm.getCookie("cmplz_marketing") || wpm.getCookie("cmplz_rt_marketing")
		let cmplz_preferences    = wpm.getCookie("cmplz_preferences") || wpm.getCookie("cmplz_rt_preferences")
		let cmplz_necessary      = wpm.getCookie("cmplz_functional") || wpm.getCookie("cmplz_rt_functional")
		let cmplz_consent_status = wpm.getCookie("cmplz_consent_status") || wpm.getCookie("cmplz_banner-status") || wpm.getCookie("cmplz_rt_banner-status")

		if (cmplz_consent_status) {

			wpm.consoleLog("Complianz CMP consent detected")

			return {
				statistics : cmplz_statistics === "" || cmplz_statistics === "allow" ? true : false,
				marketing  : cmplz_marketing === "" || cmplz_marketing === "allow" ? true : false,
				preferences: cmplz_preferences === "" || cmplz_preferences === "allow" ? true : false,
				necessary  : cmplz_necessary === "" || cmplz_necessary === "allow" ? true : false,
			}
		}

		return null
	},

	/**
	 * Complianz Cookie
	 *
	 * If visitor accepts cookies in Complianz unblock the scripts
	 */
	loadEventListeners: () => {
		document.addEventListener("cmplz_fire_categories", cmplzStatusChange)
	},
}

/**
 * Complianz
 *
 * @param consent
 */
const cmplzStatusChange = (consent) => {

	let data = {
		statistics : consent.detail.categories.includes("statistics"),
		marketing  : consent.detail.categories.includes("marketing"),
		preferences: consent.detail.categories.includes("preferences"),
		necessary  : consent.detail.categories.includes("functional"),
	}

	pmw.consent.api.updateSelectively(data)
}
