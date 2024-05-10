/**
 * Usercentrics
 *
 * https://usercentrics.com/
 * https://docs.usercentrics.com/#/cmp-v2-ui-api
 * https://docs.usercentrics.com/#/cmp-v2-ui-api?id=getservicesbaseinfo
 *
 * Although Usercentrics adopts some of the Google consent categories,
 * they don't process and save the "preferences" category.
 */
export const usercentrics = {

	/**
	 * Get the Usercentrics cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		let consent = window.localStorage.getItem("ucData")

		if (consent) {

			wpm.consoleLog("Usercentrics CMP consent detected")

			consent = JSON.parse(consent).gcm

			return {
				statistics : consent.analyticsStorage !== "denied",
				marketing  : consent.adStorage !== "denied",
				preferences: true,
				necessary  : true,
			}
		}

		return null
	},

	/**
	 * Usercentrics Event Listeners
	 *
	 * https://docs.usercentrics.com/#/v2-events?id=usage-as-window-event
	 */
	loadEventListeners: () => {

		// ucCategory: {functional: true, marketing: true, essential: true, customcategory03: true}
		// statistics seem to be customcategory03 on their website.
		// window.addEventListener("ucEvent", e => {
		// 	if (e.detail && e.detail.event == "consent_status") {
		// 		// check for consent status of service "Google Ads Remarketing"
		// 		if (e.detail["Google Ads Remarketing"] === true) {
		// 			wpm.consoleLog("Google Ads Remarketing has consent")
		// 		} else {
		// 			wpm.consoleLog("Google Ads Remarketing has no consent")
		// 		}
		// 	}
		// })

		// https://docs.usercentrics.com/#/v2-events?id=uc_ui_cmp_event
		window.addEventListener("UC_UI_CMP_EVENT", event => {

			if (event.detail.type === "ACCEPT_ALL") pmw.consent.api.acceptAll()

			if (event.detail.type === "DENY_ALL") pmw.consent.api.revokeAll()

			if (event.detail.type === "SAVE") {

				let consent = JSON.parse(e.currentTarget.localStorage.ucData).gcm

				if (consent) {
					pmw.consent.api.updateSelectively({
						statistics : consent.analyticsStorage === "granted",
						marketing  : consent.adStorage === "granted",
						preferences: true,
						necessary  : true,
					})
				}
			}
		})
	},
}
