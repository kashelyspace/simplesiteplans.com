/**
 * WP Consent API
 * https://github.com/rlankhorst/wp-consent-level-api
 * https://wordpress.org/plugins/wp-consent-api/
 *
 * TODO: add check return for necessary and preferences
 */
export const wpConsentApi = {

	/**
	 * Get the WP Consent API cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		// If a at least one cookie exists that starts with wp_consent_ then the visitor has chosen
		let consent = wpm.getCookieThatContainsRegex(/^wp_consent_/)

		if (consent) {

			wpm.consoleLog("WP Consent API CMP consent detected")

			return {
				statistics : wpm.getCookie("wp_consent_statistics") !== "deny",
				marketing  : wpm.getCookie("wp_consent_marketing") !== "deny",
				preferences: wpm.getCookie("wp_consent_preferences") !== "deny",
				necessary  : wpm.getCookie("wp_consent_functional") !== "deny",
			}

			return null
		}
	},

	/**
	 * WP Consent API
	 * https://github.com/rlankhorst/wp-consent-level-api
	 * https://wordpress.org/plugins/wp-consent-api/
	 */
	loadEventListeners: () => {

		document.addEventListener("wp_listen_for_consent_change", e => {

			const consent = e.detail

			let data = {
				statistics : consent["statistics"] !== "deny",
				marketing  : consent["marketing"] !== "deny",
				preferences: consent["preferences"] !== "deny",
				necessary  : consent["functional"] !== "deny",
			}

			pmw.consent.api.updateSelectively(data)
		})
	},
}
