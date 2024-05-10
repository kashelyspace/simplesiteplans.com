/**
 * WP Cookie Consent
 *
 * Source: https://wordpress.org/plugins/gdpr-cookie-consent/
 */

export const wpCookieConsent = {

	/**
	 * Get the WP Cookie Consent cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		let consent = wpm.getCookie("wpl_user_preference")

		if (consent) {

			wpm.consoleLog("WP Cookie Consent CMP (by wpeka.com) consent detected")

			consent = JSON.parse(consent)

			return {
				statistics : consent.analytics !== "no",
				marketing  : consent.marketing !== "no",
				preferences: consent.preferences !== "no",
				necessary  : consent.necessary !== "no",
			}
		}

		return null
	},

	/**
	 * WP Cookie Consent Event Listeners
	 *
	 * Source: https://club.wpeka.com/docs/wp-cookie-consent/settings/integrating-your-actions/
	 * Support ticket: https://wordpress.org/support/topic/gdprcookieconsentonaccept-event-never-triggered/
	 */
	loadEventListeners: () => {

		// WP Cookie Consent emits a custom event called GdprCookieConsentOnAccept
		// The event doesn't work. Probably it is not bubbling up.
		// document.addEventListener("GdprCookieConsentOnAccept", function (e) {
		// 	console.log("GdprCookieConsentOnAccept", e.detail)
		// })

		const buttonIds = [
			"cookie_action_accept",
			"cookie_action_reject",
		]

		buttonIds.forEach((buttonId) => {
			const buttonElement = document.getElementById(buttonId)

			if (buttonElement) {
				buttonElement.addEventListener("click", () => {
					/**
					 * Don't reload the page! (CMPs might emit the events on each page load, leading to a page reload loop)
					 * Only try to save the consent in the PMW.
					 */
				})
			}
		})

	},
}
