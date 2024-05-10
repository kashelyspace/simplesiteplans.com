/**
 * GDPR Cookie Compliance Plugin by Moove Agency
 * https://wordpress.org/plugins/gdpr-cookie-compliance/
 *
 * TODO write documentation on how to set up the plugin in order for this to work properly
 */
export const mooveCookieCompliance = {

	/**
	 * Get the GDPR Cookie Compliance Plugin by Moove Agency cookie.
	 *
	 * example cookie: %7B%22strict%22%3A%221%22%2C%22thirdparty%22%3A%220%22%2C%22advanced%22%3A%221%22%7D
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		let consent = wpm.getCookie("moove_gdpr_popup")

		if (consent) {

			wpm.consoleLog("GDPR Cookie Compliance CMP (by Moove Agency) consent detected")

			consent = JSON.parse(consent)

			return {
				statistics: consent.thirdparty !== "0",
				marketing : consent.advanced !== "0",
				preferences: true,
				necessary: consent.strict !== "0"
			}
		}

		return null
	},

	loadEventListeners: () => {

		if (!window.moove_frontend_gdpr_scripts) return

		// If the button with class moove-gdpr-infobar-allow-all is clicked reload the page
		const allowAllButton = document.querySelector(".mgbutton")
		if (allowAllButton) {
			allowAllButton.addEventListener("click", () => {
				/**
				 * Don't reload the page! (CMPs might emit the events on each page load, leading to a page reload loop)
				 * Only try to save the consent in the PMW.
				 */
			})
		}

		wpm.consent.cmpConsentClickObserver({classes: ["moove-gdpr-infobar-allow-all", "moove-gdpr-modal-allow-all", "moove-gdpr-modal-save-settings"]})
	},
}
