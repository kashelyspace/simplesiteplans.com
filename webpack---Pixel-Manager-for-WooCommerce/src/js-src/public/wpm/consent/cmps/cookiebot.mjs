/**
 * Cookiebot
 * https://wordpress.org/plugins/cookiebot/
 * https://support.cookiebot.com/hc/en-us/articles/360016047000-Cookiebot-and-Google-Consent-Mode
 */
export const cookiebot = {

	/**
	 * Get the Cookiebot cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		// let consent = "{stamp:%27z5ZnyohzGbbYMhDdKsdXYMG3VT5a4l7mPBcyMeFe8vasPesmw/X1sQ==%27%2Cnecessary:true%2Cpreferences:true%2Cstatistics:false%2Cmarketing:true%2Cmethod:%27explicit%27%2Cver:1%2Cutc:1712435323862%2Cregion:%27ch%27}"
		let consent = wpm.getCookie("CookieConsent")

		if (consent) {

			wpm.consoleLog("Cookiebot CMP consent detected")

			if (isValidJson(consent)) {
				consent = JSON.parse(consent)
			} else {
				consent = decodeURI(consent)
				consent = consent.replace(/'/g, "\"") // Replace single quotes with double quotes as JSON requires double quotes
				consent = decodeURIComponent(consent)
				consent = consent.replace(/(\w+):/g, "\"$1\":") // Add double quotes to keys
				consent = JSON.parse(consent)
			}

			return {
				statistics : consent.statistics ?? true,
				marketing  : consent.marketing ?? true,
				preferences: consent.preferences ?? true,
				necessary  : consent.necessary ?? true,
			}
		}

		return null
	},

	/**
	 * Cookiebot
	 * 	If visitor accepts cookies in Cookiebot unblock the scripts
	 * 	https://www.cookiebot.com/en/developer/
	 */
	loadExternalScripts: () => {

		window.addEventListener("CookiebotOnAccept", (e) => {

			let data = {
				statistics : e.currentTarget.CookieConsent.consent.statistics ?? true,
				marketing  : e.currentTarget.CookieConsent.consent.marketing ?? true,
				preferences: e.currentTarget.CookieConsent.consent.preferences ?? true,
				necessary  : e.currentTarget.CookieConsent.consent.necessary ?? true,
			}

			pmw.consent.api.updateSelectively(data)
		})
	},
}

const isValidJson = (str) => {
	try {
		JSON.parse(str)
	} catch (e) {
		return false
	}
	return true
}


