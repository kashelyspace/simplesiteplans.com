/**
 * Termly
 *
 * https://www.termly.io/
 *
 * TODO: Inform the developers. The cookie works with the new Google categories. However, the event listener is using different categories.
 */
export const termly = {

	/**
	 * Get the Termly cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		// Get Termly cookies from localStorage from termly_gtm_template_default_consents for ad_storage and for analytics_storage
		// let consent = `{"ad_personalization":"granted","ad_storage":"granted","ad_user_data":"granted","analytics_storage":"denied","functionality_storage":"granted","personalization_storage":"granted","security_storage":"granted","social_storage":"granted","unclassified_storage":"granted"}`
		let consent = localStorage.getItem("termly_gtm_template_default_consents")

		if (consent) {

			wpm.consoleLog("Termly CMP consent detected")

			consent = JSON.parse(consent)

			return {
				statistics : consent.analytics_storage !== "denied",
				marketing  : consent.ad_storage !== "denied",
				preferences: consent.functionality_storage !== "denied",
				necessary  : consent.security_storage !== "denied",
			}
		}

		return false
	},

	/**
	 * Termly Event Listeners
	 *
	 * The event listener is within /sources/termly_web/resource-blocker/src/constants/lifeCycle.js
	 *
	 * statistics = analytics
	 * marketing = advertising
	 * preferences = performance
	 * necessary = essential
	 */
	loadEventListeners: () => {

		document.addEventListener("termlyConsent", function (e) {

			const consent = e.detail

			if (
				consent.analytics
				&& consent.advertising
				&& consent.performance
			) {
				pmw.consent.api.acceptAll()
				return
			}

			if (
				!consent.analytics
				&& !consent.advertising
				&& !consent.performance
			) {
				pmw.consent.api.revokeAll()
				return
			}

			pmw.consent.api.updateSelectively({
				statistics : consent.analytics,
				marketing  : consent.advertising,
				preferences: consent.performance,
				necessary  : consent.essential,
			})

		})
	},
}
