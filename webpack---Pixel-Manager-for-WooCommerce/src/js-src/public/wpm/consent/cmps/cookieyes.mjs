/**
 * CookieYes, GDPR Cookie Consent (Cookie Law Info)
 * https://wordpress.org/plugins/cookie-law-info/
 */

export const cookieyes = {

	/**
	 * Get the CookieYes cookies
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		/**
		 * Process the new cookieyes-consent cookie that contains all the information
		 */

			// let consent = "consentid:cnpZSGg2SDZzWXJodEc3TWF3UTdKVVM3UmtKWHc3SEk,consent:yes,action:yes,necessary:yes,functional:yes,analytics:no,performance:yes,advertisement:yes"
		let consent = wpm.getCookie("cookieyes-consent")

		if (consent) {

			wpm.consoleLog("CookieYes CMP consent detected")

			// This cookie has the following structure:
			// consentid:cnpZSGg2SDZzWXJodEc3TWF3UTdKVVM3UmtKWHc3SEk,consent:yes,action:yes,necessary:yes,functional:yes,analytics:no,performance:yes,advertisement:yes
			// First split the comma-separated values into an array
			// Then split each array item into a key value pair. The key and the value are separated by a colon.
			// Then create an object from the key value pairs.
			// Then console.log the object to see what it looks like.

			consent = consentToJson(consent)

			return {
				statistics : consent.analytics ?? true,
				marketing  : consent.advertisement ?? true,
				preferences: consent.functional ?? true,
				necessary  : consent.necessary ?? true,
			}
		}

		/**
		 * Check if at least one of the cookies is set
		 *
		 * @param cookieNames
		 * @returns {boolean}
		 */
		const isOneCookieSet = (cookieNames) => {
			for (let key in cookieNames) {
				for (let cookieName of cookieNames[key]) {
					if (wpm.getCookie(cookieName)) {
						return true
					}
				}
			}
			return false
		}

		/**
		 * Process the old cookieyes-* cookies
		 *
		 * @param cookieNames
		 * @returns {boolean}
		 */
		const getCookieValue = (cookieNames) => {

			for (let cookieName of cookieNames) {
				let value = wpm.getCookie(cookieName)
				if (value === "yes") {
					return true
				} else if (value === "no") {
					return false
				}
			}

			return true
		}

		const cookieNames = {
			statistics : [
				"cookielawinfo-checkbox-analytics",
				"cookielawinfo-checkbox-analytiques",
				"cookieyes-analytics",
			],
			marketing  : [
				"cookielawinfo-checkbox-advertisement",
				"cookielawinfo-checkbox-performance",
				"cookielawinfo-checkbox-publicite",
				"cookieyes-advertisement",
			],
			preferences: [
				"cookielawinfo-checkbox-functional",
				"cookielawinfo-checkbox-preferences",
				"cookieyes-functional",
			],
			necessary  : [
				"cookielawinfo-checkbox-necessary",
				"cookielawinfo-checkbox-necessaire",
				"cookieyes-necessary",
			],
		}

		// If at least one of the cookies is set to "yes" or "no", then return the CookieYes consent
		if (isOneCookieSet(cookieNames)) {

			wpm.consoleLog("CookieYes CMP consent detected")

			return  {
				statistics : getCookieValue(cookieNames.statistics),
				marketing  : getCookieValue(cookieNames.marketing),
				preferences: getCookieValue(cookieNames.preferences),
				necessary  : getCookieValue(cookieNames.necessary),
			}
		}

		return null
	},

	loadExternalScripts: () => {

		window.addEventListener("cookieyes_consent_update", (e) => {

			let data = {
				statistics : e.detail.accepted.includes("analytics"),
				marketing  : e.detail.accepted.includes("advertisement"),
				preferences: e.detail.accepted.includes("functional"),
				necessary  : e.detail.accepted.includes("necessary"),
			}

			pmw.consent.api.updateSelectively(data)
		})
	},
}


const consentToJson = (consent) => {

	consent = consent.split(",")

	let consentObj = {}

	consent.forEach((item) => {
		let [key, value] = item.split(":")
		consentObj[key]  = value
	})

	consent = consentObj

	// make every yes or no to boolean
	for (let key in consent) {
		if (consent[key] === "yes") {
			consent[key] = true
		} else if (consent[key] === "no") {
			consent[key] = false
		}
	}

	return consent
}
