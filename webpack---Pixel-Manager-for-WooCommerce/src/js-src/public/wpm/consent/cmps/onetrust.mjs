/**
 * OneTrust
 *
 * https://www.onetrust.com/
 */

export const onetrust = {

	/**
	 * Get the OneTrust cookie.
	 *
	 * @returns {{statistics: boolean, marketing: boolean, preferences: boolean, necessary: boolean}|null}
	 */
	getConsent: () => {

		// let consent = "isGpcEnabled=0&datestamp=Sun+Apr+07+2024+06%3A58%3A30+GMT%2B0200+(Central+European+Summer+Time)&version=202401.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=ddb816ea-097a-4590-a2dc-17120c6c412c&interactionCount=2&landingPath=NotLandingPage&groups=1%3A1%2C2%3A0%2C3%3A1%2C4%3A1&geolocation=CH%3BZH&AwaitingReconsent=false"
		let consent = wpm.getCookie("OptanonConsent")

		if (consent) {

			wpm.consoleLog("OneTrust CMP consent detected")

			consent = consentToJSON(consent)

			// group mapping
			// 1 = necessary
			// 2 = analytics
			// 3 = functional
			// 4 = ads

			return {
				statistics : consent["2"] ?? true,
				marketing  : consent["4"] ?? true,
				preferences: consent["3"] ?? true,
				necessary  : consent["1"] ?? true,
			}
		}

		return null
	},

	/**
	 * OneTrust Event Listeners
	 */
	loadEventListeners: () => {

		window.addEventListener("consent.onetrust", (e) => {

			let data = {
				statistics : e.detail.includes("2"),
				marketing  : e.detail.includes("4"),
				preferences: e.detail.includes("3"),
				necessary  : e.detail.includes("1"),
			}

			pmw.consent.api.updateSelectively(data)
		})
	},
}

const consentToJSON = (consent) => {

	consent = decodeURIComponent(consent);

	let consentObject = consent.split("&").reduce((obj, item) => {
		let [key, value] = item.split("=");
		obj[key] = value;
		return obj;
	}, {});

	consentObject.groups = consentObject.groups.split(",").reduce((obj, item) => {
		let [key, value] = item.split(":");
		obj[key] = value === '1';
		return obj;
	}, {});

	return consentObject.groups
}
