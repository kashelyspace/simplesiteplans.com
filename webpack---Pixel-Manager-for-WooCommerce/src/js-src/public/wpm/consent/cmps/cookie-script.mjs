/**
 * Cookie Script
 * https://wordpress.org/plugins/cookie-script-com/
 */
export const cookieScript = {

	/**
	 * Get the Cookie Script cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		let consent = wpm.getCookie("CookieScriptConsent")

		if (consent) {

			wpm.consoleLog("Cookie Script CMP consent detected")

			consent = JSON.parse(consent)

			// if cookie.categories is not an array, but a string, parse it
			if (typeof consent.categories === "string") consent.categories = JSON.parse(consent.categories)

			if (
				consent.action
				&& consent.action === "reject"
			) {
				return {
					statistics : false,
					marketing  : false,
					preferences: false,
					necessary  : true,
				}
			}

			if (
				consent.categories
				&& consent.categories.length > 0
			) {

				return {
					statistics : consent.categories.indexOf("performance") >= 0,
					marketing  : consent.categories.indexOf("targeting") >= 0,
					preferences: consent.categories.indexOf("functionality") >= 0,
					necessary  : true,
				}
			}

			return {
				statistics : true,
				marketing  : true,
				preferences: true,
				necessary  : true,
			}
		}

		return null
	},

	/**
	 * Cookie Script
	 * If visitor accepts cookies in Cookie Script unblock the scripts
	 * https://support.cookie-script.com/article/20-custom-events
	 */

	loadEventListeners: () => {

		document.addEventListener("CookieScriptAccept", e => {

			let data = {
				statistics : e.detail.categories.includes("performance"),
				marketing  : e.detail.categories.includes("targeting"),
				preferences: e.detail.categories.includes("functionality"),
				necessary  : true,
			}

			pmw.consent.api.updateSelectively(data)
		})

		document.addEventListener("CookieScriptAcceptAll", () => {
			pmw.consent.api.acceptAll()
		})

		document.addEventListener("CookieScriptReject", () => {
			pmw.consent.api.revokeAll()
		})
	},
}
