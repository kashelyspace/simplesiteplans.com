export const loadDeprecatedFunctions = () => {

	pmw.consentAcceptAll = (data) => {
		console.error("The function pmw.consentAcceptAll is deprecated since version 1.41.1 and will be removed in the future. It has been replaced by: pmw.consent.api.acceptAll()")
		pmw.consent.api.acceptAll(data)
	}

	pmw.consentRevokeAll = (data) => {
		console.error("The function pmw.consentRevokeAll is deprecated since version 1.41.1 and will be removed in the future. It has been replaced by: pmw.consent.api.revokeAll()")
		pmw.consent.api.revokeAll(data)
	}

	pmw.consentAdjustSelectively = (data) => {
		console.error("The function pmw.consentAdjustSelectively is deprecated since version 1.41.1 and will be removed in the future. It has been replaced by: pmw.consent.api.adjustSelectively()")

		data = renameDataKeys(data)
		pmw.consent.api.updateSelectively(data)
	}

	/**
	 * Rename data keys
	 *
	 * The variable data can have a key analytics and a key ads
	 * they need to be rewritten to statistics and marketing
	 *
	 * @param data
	 * @returns {*}
	 */
	const renameDataKeys = (data) => {
		if (data.analytics) {
			data.statistics = data.analytics
			delete data.analytics
		}

		if (data.ads) {
			data.marketing = data.ads
			delete data.ads
		}

		return data
	}
}
