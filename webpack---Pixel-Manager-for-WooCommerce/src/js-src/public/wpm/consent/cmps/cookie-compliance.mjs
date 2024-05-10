/**
 * Cookie Compliance (free version)
 * https://wordpress.org/plugins/cookie-notice/
 */
export const cookieCompliance = {

	/**
	 * Get the Cookie Compliance cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		// Free version
		let consent = wpm.getCookie("cookie_notice_accepted")

		// If the cookie is set, it contains the string "true" or "false"
		if (consent) {

			wpm.consoleLog("Cookie Compliance CMP (by hu-manity.co) consent detected")

			// Convert the string "true" to true and "false" to false
			consent = consent === "true"

			return {
				statistics : consent,
				marketing  : consent,
				preferences: consent,
				necessary  : true,
			}
		}

		// Paid version
		consent = wpm.getCookie("hu-consent")

		if (consent) {

			wpm.consoleLog("Cookie Compliance CMP (by hu-manity.co) consent detected")

			consent = JSON.parse(consent)

			return {
				statistics : consent.categories["3"] ?? true,
				marketing  : consent.categories["4"] ?? true,
				preferences: consent.categories["2"] ?? true,
				necessary  : consent.categories["1"] ?? true,
			}
		}

		return null
	},

	/**
	 * Cookie Compliance by hu-manity.co (free and pro)
	 * If visitor accepts cookies in Cookie Notice by hu-manity.co unblock the scripts (free version)
	 * https://wordpress.org/support/topic/events-on-consent-change/#post-15202792
	 */
	loadEventListeners: () => {
		document.addEventListener("set-consent.hu", (e) => {

			// Validate that e.detail.categories exists
			if (!e.detail.categories) return

			let data = {
				statistics : e.detail.categories["3"],
				marketing  : e.detail.categories["4"],
				preferences: e.detail.categories["2"],
				necessary  : e.detail.categories["1"],
			}

			pmw.consent.api.updateSelectively(data)
		})
	},
}
