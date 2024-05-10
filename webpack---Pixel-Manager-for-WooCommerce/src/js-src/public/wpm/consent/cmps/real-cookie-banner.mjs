/**
 * Real Cookie Banner
 *
 * https://devowl.io/wordpress-real-cookie-banner/
 */
export const realCookieBanner = {

	/**
	 * Get the Real Cookie Banner cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		if (!isRcbCookieSet()) return null

		wpm.waitForLibrary("consentApi")

		if (!window.consentApi) return null

		wpm.consoleLog("Real Cookie Banner CMP consent detected")

		let consent = {
			statistics : undefined,
			marketing  : undefined,
			preferences: true,
			necessary  : true,
		}

		// For each service in settings
		// and each cookie in service.cookies
		// check if consentApi.consentSync("http", cookie, "*") returns an object that contains a not empty object called "cookie"
		// If one of the cookies returns true, then push service.service to wpmConsentValues.pixels
		rcbSettings.forEach((service) => {

			service.cookies.forEach((cookie) => {

				let rcbConsent = window.consentApi.consentSync("http", cookie, "*")

				if (rcbConsent?.cookie && rcbConsent?.cookieOptIn) {

					switch (service.type) {
						case "statistics":
							consent.statistics = true
							break
						case "marketing":
							consent.marketing = true
							break
						case "preferences":
							consent.preferences = true
							break
						case "necessary":
							consent.necessary = true
							break
					}
				}
			})
		})

		return consent
	},

	/**
	 * Real Cookie Banner
	 * If the visitor accepts cookies in Real Cookie Banner unblock the scripts.
	 */
	loadEventListeners: () => {


		document.addEventListener("RCB/OptIn/All", (e) => {

			/**
			 * Don't reload the page! RCB fires the event on each page load. Not just when the banner is clicked.
			 */
		})
	},
}

const isRcbCookieSet = () => {

	// Find a cookie that has a prefix of real_cookie_banner
	// If one is found, then return true
	// If none is found, then return false

	let cookies = document.cookie.split(";")

	for (let i = 0; i < cookies.length; i++) {
		let cookie = cookies[i].trim()

		if (cookie.startsWith("real_cookie_banner")) {
			return true
		}
	}

	return false
}

const rcbSettings = [
	{
		"service": "adroll-ads",
		"type"   : "marketing",
		"cookies": ["__adroll_fpc", "_ar_v4", "_adroll"],
	},
	{
		"service": "bing-ads",
		"type"   : "marketing",
		"cookies": ["_uetsid", "_uetvid"],
	},
	{
		"service": "facebook-ads",
		"type"   : "marketing",
		"cookies": ["_fbp"],
	},
	{
		"service": "google-analytics",
		"type"   : "statistics",
		"cookies": ["_ga", "_gid", "_gat", "_gat_gtag_UA_*"],
	},
	{
		"service": "google-optimize",
		"type"   : "statistics",
		"cookies": ["_ga", "_gid", "_gat", "_gat_gtag_UA_*"],
	},
	{
		"service": "google-ads",
		"type"   : "marketing",
		"cookies": ["_gcl_au", "_gcl_aw", "_gcl_dc", "_gac_*"],
	},
	{
		"service": "hotjar",
		"type"   : "statistics",
		"cookies": ["_hj*", "_hjid"],
	},
	{
		"service": "linkedin-ads",
		"type"   : "marketing",
		"cookies": ["_li_ss", "_li_id", "_li_mk_*"],
	},
	{
		"service": "microsoft-ads",
		"type"   : "marketing",
		"cookies": ["_uetsid", "_uetvid"],
	},
	{
		"service": "outbrain-ads",
		"type"   : "marketing",
		"cookies": [],
	},
	{
		"service": "pinterest-ads",
		"type"   : "marketing",
		"cookies": ["_pinterest_ct_ua", "_pinterest_ct_rt", "_pin_unauth", "_derived_epik", "_pinterest_sess"],
	},
	{
		"service": "reddit-ads",
		"type"   : "marketing",
		"cookies": ["_rdt_uuid"],
	},
	{
		"service": "snapchat-ads",
		"type"   : "marketing",
		"cookies": ["sc_at", "sc_anonymous_id", "sc_id", "_scid", "_scid_r"],
	},
	{
		"service": "taboola-ads",
		"type"   : "marketing",
		"cookies": [],
	},
	{
		"service": "tiktok-ads",
		"type"   : "marketing",
		"cookies": ["_ttp", "_ttclid", "ttwid"],
	},
	{
		"service": "twitter-ads",
		"type"   : "marketing",
		"cookies": ["twitter_ads_id", "twid", "_twclid", "muc_ads"],
	},
]
