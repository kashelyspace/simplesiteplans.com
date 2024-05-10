export const iubenda = {

	/**
	 * Get the Iubenda cookie.
	 * Then parse it and return the analytics and marketing values.
	 *
	 * 1 = Necessary
	 * 2 = Functionality
	 * 3 = n/a
	 * 4 = Measurement
	 * 5 = Marketing
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 * */
	getConsent: () => {

		// Regex that matches _iub_cs-59340121 but not _iub_cs-59340121-granular

		let regex = new RegExp("_iub_cs-\\d{8,}")

		// let cookie = wpm.getCookieThatContainsRegex("_iub_cs-")
		let consent = wpm.getCookieThatContainsRegex(regex)

		// Parse the cookie into an object
		// The structure looks like this:
		// %7B%22timestamp%22%3A%222023-07-11T06%3A43%3A40.886Z%22%2C%22version%22%3A%221.48.0%22%2C%22purposes%22%3A%7B%221%22%3Atrue%2C%222%22%3Atrue%2C%224%22%3Atrue%2C%225%22%3Atrue%7D%2C%22id%22%3A63374232%7D

		if (consent) {

			wpm.consoleLog("Iubenda CMP consent detected")

			consent = decodeURIComponent(consent)

			// Now the structure looks like this:
			// _iub_cs-63374232={"timestamp":"2023-07-11T06:43:40.886Z","version":"1.48.0","purposes":{"1":true,"2":true,"4":true,"5":true},"id":63374232}
			// Remove the _iub_cs- prefix until and with the equal sign. The rest is the object we want to keep and parse.
			consent = consent.replace(/_iub_cs-.*=/, "")

			consent = JSON.parse(consent)

			/**
			 * 1: necessary
			 * 2: functionality
			 * 3: experience
			 * 4: measurement
			 * 5: marketing
			 */

			return {
				statistics : consent.purposes["4"] ?? true,
				marketing  : consent.purposes["5"] ?? true,
				preferences: consent.purposes["2"] ?? true,
				necessary  : consent.purposes["1"] ?? true,
			}
		}

		return null
	},

	/**
	 * Iubenda CMP has no intelligent way of letting us know when the user has clicked the "Accept" button.
	 * We have to resort to a MutationObserver to listen for changes in the DOM.
	 * This is also why we have to reload the page when the user clicks the "Accept" button.
	 * Reading the cookies on the same page will not work because the cookies are not set in time when the observer is triggered.
	 */
	loadEventListeners: () => {

		// If the Iubenda CMP is not present, there's no need to continue
		if (!window._iub) return

		wpm.consent.cmpConsentClickObserver({
			ids    : ["iubFooterBtn"],
			classes: ["iubenda-cs-reject-btn", "iubenda-cs-accept-btn"],
		})
	},
}


