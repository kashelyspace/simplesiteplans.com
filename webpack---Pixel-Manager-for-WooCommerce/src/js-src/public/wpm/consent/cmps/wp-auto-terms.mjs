/**
 * WP AutoTerms
 * https://wordpress.org/plugins/auto-terms-of-service-and-privacy-policy/
 */
export const wpAutoTerms = {

	/**
	 * Get the WP AutoTerms cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		let consent = wpm.getCookie("wpautoterms-cookies-notice")

		if (consent && consent === "1") {

			wpm.consoleLog("WP AutoTerms CMP consent detected")

			return {
				statistics : true,
				marketing  : true,
				preferences: true,
				necessary  : true,
			}
		}

		return null
	},

	loadEventListeners: () => {

		// Add an event listener to the button with the class wpautoterms-notice-close
		let button = document.querySelectorAll(".wpautoterms-notice-close")[0]

		if (button) {

			button.addEventListener("click", event => {
				pmw.consent.api.acceptAll()
			})
		}
	}
}
