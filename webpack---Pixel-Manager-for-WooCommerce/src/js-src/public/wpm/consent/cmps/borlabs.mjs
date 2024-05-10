/**
 * Borlabs Cookie
 *
 * The PMW only supports the Borlabs Cookie version 2.x.
 * And it only supports category based consent.
 *
 * https://borlabs.io/borlabs-cookie/
 */
export const borlabs = {

	/**
	 * Get the Borlabs Cookie cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 **/
	getConsent: () => {

		let consent = wpm.getCookie("borlabs-cookie")

		if (consent) {

			wpm.consoleLog("Borlabs Cookie CMP consent detected")

			console.log("Pixel Manger: We deprecated direct support for Borlabs Cookie. Borlabs Cookie still can pass consent to PMW by using Google Consent Mode update calls which will be processd by the Pixel Manager.")

			consent = decodeURI(consent)
			consent = JSON.parse(consent)

			return {
				statistics : consent?.consents?.statistics ?? true,
				marketing  : consent?.consents?.marketing ?? true,
				preferences: true,
				necessary  : true,
			}
		}

		return null
	},

	/**
	 * Borlabs Cookie
	 * If the visitor accepts cookies in Borlabs Cookie unblock the scripts.
	 *
	 * @returns {void}
	 **/
	loadEventListeners: () => {
		document.addEventListener("borlabs-cookie-consent-saved", () => {
			/**
			 * Don't reload the page! (CMPs might emit the events on each page load, leading to a page reload loop)
			 * Only try to save the consent in the PMW.
			 */
		})
	},
}
