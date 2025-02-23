/**
 * IP functions
 */

(function(wpm, $, undefined) {

    const {
        isRange,
        isIP,
        isV4,
        isV6,
        version: getIpVersion
    } = require("range_check")

    const ipServices = {
        "cloudflare": {
            "any": "https://www.cloudflare.com/cdn-cgi/trace",
        },
        // icanhazip seems to regularly be added to malware databases, despite being a legitimate service run by Cloudflare
        // https://blog.apnic.net/2021/06/17/how-a-small-free-ip-tool-survived/
        // https://major.io/p/a-new-future-for-icanhazip/
        // https://major.io/p/extra-icanhaz-services-going-offline/
        "icanhazip": {
            "4": "https://ipv4.icanhazip.com",
            "6": "https://ipv6.icanhazip.com",
            "any": "https://icanhazip.com",
        },
        "ipinfo": {
            "any": "https://ipinfo.io/ip",
        },
        "myexternalip": {
            "any": "https://myexternalip.com/raw",
            // "6": "https://api-ipv6.myexternalip.com/raw", // This can return an IPv4 address, so we can't use it
        },
        "ipify": {
            "4": "https://api4.ipify.org",
            "6": "https://api6.ipify.org",
            "any": "https://api64.ipify.org", // If IPv6 is available, AND the client is configured to prefer IPv6, this will return an IPv6 address
        },
        // Can't use amazon because its CORS policy blocks requests from the browser
        // "amazon"    : {
        // 	"any": "https://checkip.amazonaws.com/",
        // },
        // Can't use ip.sb because its CORS policy blocks requests from the browser
        // "ip.sb"     : {
        // 	"any": "https://api.ip.sb/ip",
        // },
        // Can't use seeip because its CORS policy blocks requests from the browser
        // "seeip"       : {
        // 	"any": "https://api.seeip.org",
        // 	"4": "https://ipv4.seeip.org",
        // 	"6": "https://ipv6.seeip.org",
        // },
    }

    wpm.getGeoInfo = {

        geojs: async () => {
            // const startTime = performance.now()

            const response = await fetch("https://get.geojs.io/v1/ip/country.json")
            let data = await response.json()
            // console.log("time taken: " + (performance.now() - startTime).toFixed(2) + " ms")

            return {
                ip: data.ip,
                countryCode: data.country,
            }
        },

        cloudflare: async () => {

            // const startTime = performance.now()

            const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace")
            let data = await response.text()

            // Convert key-value pairs to JSON
            // https://stackoverflow.com/a/39284735/452587
            data = data
                .trim()
                .split("\n")
                .reduce((obj, pair) => {
                    pair = pair.split("=")
                    return obj[pair[0]] = pair[1], obj
                }, {})

            // console.log("time taken: " + (performance.now() - startTime).toFixed(2) + " ms")
            // return the data.ip not a promise
            return {
                ip: data.ip,
                countryCode: data.loc,
            }
        },

        ipinfoIo: async () => {
            // const startTime = performance.now()

            const response = await fetch("https://ipinfo.io/json")
            let data = await response.json()
            // console.log("time taken: " + (performance.now() - startTime).toFixed(2) + " ms")

            return {
                ip: data.ip,
                countryCode: data.country,
            }
        },

        ipapiCo: async () => {
            // const startTime = performance.now()

            const response = await fetch("https://ipapi.co/json")
            let data = await response.json()
            // console.log("time taken: " + (performance.now() - startTime).toFixed(2) + " ms")

            return {
                ip: data.ip,
                countryCode: data.country,
            }
        },
    }

    wpm.isIpAllowed = async () => {

        // Check the cache if the IP is allowed
        if (wpm.retrieveData("ipAllowed")) {
            return !!JSON.parse(wpm.retrieveData("ipAllowed"))
        }

        const ip = await wpm.getIp()

        // If the IP is blacklisted, return false and store the result in the cache
        if (isOnBlacklist(ip)) {
            wpm.storeData("ipAllowed", false)
            return false
        }

        // If the IP is not blacklisted, return true and store the result in the cache
        wpm.storeData("ipAllowed", true)
        return true
    }

    wpm.getIp = async (ipVersion = "any", maxServicesToCheck = 3) => {

        const validVersions = ["any", "4", "6"]

        // return null if the version is not valid and console log an error
        if (!validVersions.includes(ipVersion)) {
            console.error("The version argument must be one of the following: " + validVersions.join(", "))
            return null
        }

        if (ipVersion === "any" && wpm.retrieveData("ip")) {
            return wpm.retrieveData("ip")
        }

        // Get the ipv data from the cache
        const ipv = wpm.retrieveData(`ipv${ipVersion}`)

        // Return it if it is not undefined
        // The value can be an IP
        // or null if we ran the test but no IP could be retrieved
        // It is undefined if the ipVersion was not tested yet
        if (ipv !== undefined) return ipv

        wpm.consoleLog("Testing the IP address of the browser because one ore more server-to-server APIs are enabled and require the browser IP. It may trigger connection request errors in the console while testing the IP address. This is normal and expected behavior.")

        try { // Check the cache if the IP is already stored

            const ip = await wpm.getIpFromAnyService(ipVersion, maxServicesToCheck)

            // if (!isIP(ip)) throw new Error("The returned value is not an IP address")

            // Store the IP in the cache
            if (ipVersion === "any") {
                wpm.storeData("ip", ip)
            }

            if (
                getIpVersion(ip) === 4 ||
                (ipVersion === "4" && ip === null)
            ) {
                wpm.storeData("ipv4", ip)
            }

            if (getIpVersion(ip) === 6 ||
                (ipVersion === "6" && ip === null)
            ) {
                wpm.storeData("ipv6", ip)
            }

            return ip
        } catch (error) {
            // console.error(error)
            return null
        }
    }

    wpm.getBrowserGeoFromExternalService = async () => {

        const startTime = performance.now()

        let promises = []

        Object.keys(wpm.getGeoInfo).forEach(service => {
            promises.push(wpm.getGeoInfo[service]())
        })

        try {
            const data = await Promise.any(promises)

            data.countryCode = data.countryCode.toUpperCase()

            wpm.consoleLog("time taken: " + (performance.now() - startTime).toFixed(2) + " ms")
            wpm.consoleLog("The Pixel Manager retrieved following data from the external service: ", data)

            wpm.storeData("countryCode", data.countryCode)
            wpm.storeData("ip", data.ip)
            return data
        } catch (error) {
            wpm.consoleError(error)
            return null
        }
    }

    const getBrowserCountryByTimeZone = () => {

        const geo = require("./geo/geo.mjs")
        const countryCode = geo.getCountryByTimeZone()

        if (countryCode) {
            wpm.storeData("countryCode", countryCode)
            return countryCode
        }

        return null
    }

    wpm.getBrowserCountry = async () => {

        wpm.consoleLog("Retrieving the country of the browser.")

        if (wpm.retrieveData("countryCode")) {
            wpm.consoleLog("The Pixel Manager retrieved the country of the browser from the cache: ", wpm.retrieveData("countryCode"))
            return wpm.retrieveData("countryCode")
        }

        const geoInfo = await wpm.getBrowserGeoFromExternalService()

        if (geoInfo ? .countryCode) {
            wpm.consoleLog("The Pixel Manager retrieved the country of the browser using an external service: ", geoInfo.countryCode)
            return geoInfo.countryCode
        }

        // If the external services fail, try to use the timezone fallback to get the country
        const countryCode = getBrowserCountryByTimeZone()

        if (countryCode) {
            wpm.consoleLog("The Pixel Manager retrieved the country of the browser using the timezone fallback: ", countryCode)
            return countryCode
        }

        return "unknown"
    }

    /**
     * Get the IP from the visitor using different services.
     * Return the first valid IP address that can be retrieved the fastest.
     *
     * @returns {Promise<IP>}
     */
    wpm.getIpFromAnyService = async (ipVersion = "any", maxServicesToCheck = 3) => {

        // start tracking time
        const startTime = performance.now()

        // take the ipServices object and filter it to only contain objects with an ipVersion key that matches the ipVersion argument
        // keep the original order of the ipServices object
        // also keep only the first maxServicesToCheck objects

        const ipServicesFiltered = Object.keys(ipServices)
            .filter(service => ipServices[service][ipVersion])
            .slice(0, maxServicesToCheck)
            .reduce((obj, key) => {
                obj[key] = ipServices[key]
                return obj
            }, {})

        let promises = []

        Object.keys(ipServicesFiltered).forEach(service => {
            // only push if the ipVersion is available for the service
            if (ipServicesFiltered[service][ipVersion]) {
                // console.log(`pushing ${service} to promises array with ipVersion ${ipVersion}`)
                promises.push(wpm.getIpFromService(service, ipVersion))
            }
        })

        // If the promises array is not empty, return the first promise that resolves the fastest
        // Ignore the promises that reject
        if (promises.length > 0) {

            try {
                const data = await Promise.any(promises)
                // console.log(`The Pixel Manager retrieved the IP address ${data.ip} from ${data.service} using IP version ${data.ipVersion}`)

                // stop tracking time
                const endTime = performance.now()
                const timeTaken = (endTime - startTime).toFixed(2)

                wpm.consoleLog(`Retrieved the IP address ${data.ip} from ${data.service} which took ${timeTaken} ms`)
                return data.ip
            } catch (error) {
                // console.error(error)
                wpm.consoleLog(`Could not retrieve an IP with version ${ipVersion} from any of the services.`)
                return null
            }

        } else {
            wpm.consoleLog("No promises to resolve")
            return null
        }
    }

    /**
     * Fetches the IP address from a specified service.
     *
     * @async
     * @param {string} service - The name of the service to fetch the IP from.
     * @param {string} [ipVersion="any"] - The version of the IP (e.g., "any" for global).
     * @returns {Promise<Object>} A promise that resolves to an object containing the IP address, service name, and IP version.
     * @throws {Error} Will reject the promise with an error if the IP version is not available for the service, the response from the service is not OK, the returned value from the service is not an IP address, or any other error occurs.
     */
    wpm.getIpFromService = async (service, ipVersion = "any") => {
        try {

            let data = {
                ip: null,
                service: service,
                ipVersion: ipVersion,
            }

            // Return reject if the ipVersion is not available for the service
            if (!ipServices[service][ipVersion]) return Promise.reject(new Error(`The IP version ${ipVersion} is not available for the service ${service}`))

            wpm.consoleLog(`Fetching IP from ${service} using IP version ${ipVersion}`)

            const response = await fetch(ipServices[service][ipVersion])

            if (!response.ok) {
                return Promise.reject(new Error(`The response from ${service} was not OK. Status: ${response.status}`))
            }

            let serviceResponseData = await response.text()

            if (service === "cloudflare") {
                // Convert key-value pairs to JSON
                serviceResponseData = serviceResponseData
                    .trim()
                    .split("\n")
                    .reduce((obj, pair) => {
                        pair = pair.split("=")
                        return (obj[pair[0]] = pair[1]), obj
                    }, {})

                data.ip = serviceResponseData.ip
            } else {
                data.ip = serviceResponseData.trim()
            }

            if (!isIP(data.ip)) {
                return Promise.reject(new Error(`The returned value from ${service} is not an IP address`))
            }

            return data
        } catch (error) {
            return Promise.reject(error)
        }
    }

    /**
     * Cloudflare
     *
     * Response time: approx. 70ms
     * IPv: Returns IPv4 or IPv6 depending on the client
     * Dual stack: Doesn't offer dual stack detection
     *
     * @returns {Promise<*>}
     */
    const getIpFromCloudflare = async () => {

        const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace")
        let data = await response.text()

        // Convert key-value pairs to JSON
        // https://stackoverflow.com/a/39284735/452587
        data = data
            .trim()
            .split("\n")
            .reduce((obj, pair) => {
                pair = pair.split("=")
                return obj[pair[0]] = pair[1], obj
            }, {})

        // return the data.ip not a promise
        return data.ip
    }

    wpm.isIpNotAllowed = async () => {
        return await wpm.isIpAllowed() === false
    }

    const isOnBlacklist = ip => {

        const {
            isInSubnet
        } = require("is-in-subnet")

        for (const ipName of getBlacklist()) {

            if (isCidr(ipName)) {
                try {
                    if (isInSubnet(ip, ipName)) return true
                } catch (e) {
                    wpm.consoleError(e)
                    wpm.consoleLog("IP: " + ip)
                }
            } else {
                if (ip === ipName) return true
            }
        }

        return false
    }

    const isCidr = ipName => {
        return isRange(ipName)
    }

    const getBlacklist = () => {

        const blacklist = [
            // "91.190.12.52/32", // for testing
            // "91.190.12.52", // for testing
        ]

        const google = [
            "2001:4860:4801:10::/64",
            "2001:4860:4801:11::/64",
            "2001:4860:4801:12::/64",
            "2001:4860:4801:13::/64",
            "2001:4860:4801:14::/64",
            "2001:4860:4801:15::/64",
            "2001:4860:4801:16::/64",
            "2001:4860:4801:17::/64",
            "2001:4860:4801:18::/64",
            "2001:4860:4801:19::/64",
            "2001:4860:4801:1a::/64",
            "2001:4860:4801:1b::/64",
            "2001:4860:4801:20::/64",
            "2001:4860:4801:21::/64",
            "2001:4860:4801:22::/64",
            "2001:4860:4801:23::/64",
            "2001:4860:4801:24::/64",
            "2001:4860:4801:25::/64",
            "2001:4860:4801:26::/64",
            "2001:4860:4801:27::/64",
            "2001:4860:4801:28::/64",
            "2001:4860:4801:29::/64",
            "2001:4860:4801:2::/64",
            "2001:4860:4801:2a::/64",
            "2001:4860:4801:2b::/64",
            "2001:4860:4801:2c::/64",
            "2001:4860:4801:2d::/64",
            "2001:4860:4801:2e::/64",
            "2001:4860:4801:2f::/64",
            "2001:4860:4801:30::/64",
            "2001:4860:4801:31::/64",
            "2001:4860:4801:32::/64",
            "2001:4860:4801:33::/64",
            "2001:4860:4801:34::/64",
            "2001:4860:4801:35::/64",
            "2001:4860:4801:36::/64",
            "2001:4860:4801:37::/64",
            "2001:4860:4801:38::/64",
            "2001:4860:4801:39::/64",
            "2001:4860:4801:3::/64",
            "2001:4860:4801:3a::/64",
            "2001:4860:4801:3b::/64",
            "2001:4860:4801:3c::/64",
            "2001:4860:4801:3d::/64",
            "2001:4860:4801:3e::/64",
            "2001:4860:4801:40::/64",
            "2001:4860:4801:41::/64",
            "2001:4860:4801:42::/64",
            "2001:4860:4801:43::/64",
            "2001:4860:4801:44::/64",
            "2001:4860:4801:45::/64",
            "2001:4860:4801:46::/64",
            "2001:4860:4801:47::/64",
            "2001:4860:4801:48::/64",
            "2001:4860:4801:49::/64",
            "2001:4860:4801:4a::/64",
            "2001:4860:4801:50::/64",
            "2001:4860:4801:51::/64",
            "2001:4860:4801:53::/64",
            "2001:4860:4801:60::/64",
            "2001:4860:4801:61::/64",
            "2001:4860:4801:62::/64",
            "2001:4860:4801:63::/64",
            "2001:4860:4801:64::/64",
            "2001:4860:4801:65::/64",
            "2001:4860:4801:66::/64",
            "2001:4860:4801:67::/64",
            "2001:4860:4801:68::/64",
            "2001:4860:4801:69::/64",
            "2001:4860:4801:6a::/64",
            "2001:4860:4801:6b::/64",
            "2001:4860:4801:6c::/64",
            "2001:4860:4801:6d::/64",
            "2001:4860:4801:6e::/64",
            "2001:4860:4801:6f::/64",
            "2001:4860:4801:70::/64",
            "2001:4860:4801:71::/64",
            "2001:4860:4801:72::/64",
            "2001:4860:4801:73::/64",
            "2001:4860:4801:74::/64",
            "2001:4860:4801:75::/64",
            "2001:4860:4801:76::/64",
            "2001:4860:4801:77::/64",
            "2001:4860:4801:80::/64",
            "2001:4860:4801:81::/64",
            "2001:4860:4801:82::/64",
            "2001:4860:4801:83::/64",
            "2001:4860:4801:84::/64",
            "2001:4860:4801:85::/64",
            "2001:4860:4801:86::/64",
            "2001:4860:4801:90::/64",
            "2001:4860:4801:91::/64",
            "2001:4860:4801:92::/64",
            "2001:4860:4801::/64",
            "2001:4860:4801:c::/64",
            "2001:4860:4801:f::/64",
            "34.100.182.96/28",
            "34.101.50.144/28",
            "34.118.254.0/28",
            "34.118.66.0/28",
            "34.126.178.96/28",
            "34.146.150.144/28",
            "34.147.110.144/28",
            "34.151.74.144/28",
            "34.152.50.64/28",
            "34.154.114.144/28",
            "34.155.98.32/28",
            "34.165.18.176/28",
            "34.175.160.64/28",
            "34.176.130.16/28",
            "34.64.82.64/28",
            "34.65.242.112/28",
            "34.80.50.80/28",
            "34.88.194.0/28",
            "34.89.10.80/28",
            "34.89.198.80/28",
            "34.96.162.48/28",
            "35.247.243.240/28",
            "66.249.64.0/27",
            "66.249.64.128/27",
            "66.249.64.160/27",
            "66.249.64.192/27",
            "66.249.64.224/27",
            "66.249.64.32/27",
            "66.249.64.64/27",
            "66.249.64.96/27",
            "66.249.65.0/27",
            "66.249.65.128/27",
            "66.249.65.160/27",
            "66.249.65.192/27",
            "66.249.65.224/27",
            "66.249.65.32/27",
            "66.249.65.64/27",
            "66.249.65.96/27",
            "66.249.66.0/27",
            "66.249.66.128/27",
            "66.249.66.192/27",
            "66.249.66.32/27",
            "66.249.66.64/27",
            "66.249.68.0/27",
            "66.249.68.32/27",
            "66.249.68.64/27",
            "66.249.69.0/27",
            "66.249.69.128/27",
            "66.249.69.160/27",
            "66.249.69.192/27",
            "66.249.69.224/27",
            "66.249.69.32/27",
            "66.249.69.64/27",
            "66.249.69.96/27",
            "66.249.70.0/27",
            "66.249.70.128/27",
            "66.249.70.160/27",
            "66.249.70.192/27",
            "66.249.70.224/27",
            "66.249.70.32/27",
            "66.249.70.64/27",
            "66.249.70.96/27",
            "66.249.71.0/27",
            "66.249.71.128/27",
            "66.249.71.160/27",
            "66.249.71.192/27",
            "66.249.71.32/27",
            "66.249.71.64/27",
            "66.249.71.96/27",
            "66.249.72.0/27",
            "66.249.72.128/27",
            "66.249.72.160/27",
            "66.249.72.192/27",
            "66.249.72.224/27",
            "66.249.72.32/27",
            "66.249.72.64/27",
            "66.249.72.96/27",
            "66.249.73.0/27",
            "66.249.73.128/27",
            "66.249.73.160/27",
            "66.249.73.192/27",
            "66.249.73.224/27",
            "66.249.73.32/27",
            "66.249.73.64/27",
            "66.249.73.96/27",
            "66.249.74.0/27",
            "66.249.74.32/27",
            "66.249.74.64/27",
            "66.249.74.96/27",
            "66.249.75.0/27",
            "66.249.75.128/27",
            "66.249.75.160/27",
            "66.249.75.192/27",
            "66.249.75.224/27",
            "66.249.75.32/27",
            "66.249.75.64/27",
            "66.249.75.96/27",
            "66.249.76.0/27",
            "66.249.76.128/27",
            "66.249.76.160/27",
            "66.249.76.192/27",
            "66.249.76.224/27",
            "66.249.76.32/27",
            "66.249.76.64/27",
            "66.249.76.96/27",
            "66.249.77.0/27",
            "66.249.77.128/27",
            "66.249.77.32/27",
            "66.249.77.64/27",
            "66.249.77.96/27",
            "66.249.79.0/27",
            "66.249.79.128/27",
            "66.249.79.160/27",
            "66.249.79.192/27",
            "66.249.79.224/27",
            "66.249.79.32/27",
            "66.249.79.64/27",
            "66.249.79.96/27",
        ]

        const facebook = [
            "69.63.176.0/20",
            "66.220.144.0/20",
            "66.220.144.0/21",
            "69.63.184.0/21",
            "69.63.176.0/21",
            "74.119.76.0/22",
            "69.171.255.0/24",
            "173.252.64.0/18",
            "69.171.224.0/19",
            "69.171.224.0/20",
            "103.4.96.0/22",
            "173.252.64.0/19",
            "31.13.64.0/18",
            "31.13.24.0/21",
            "66.220.152.0/21",
            "69.171.239.0/24",
            "69.171.240.0/20",
            "31.13.64.0/19",
            "31.13.64.0/24",
            "31.13.65.0/24",
            "31.13.67.0/24",
            "31.13.68.0/24",
            "31.13.69.0/24",
            "31.13.70.0/24",
            "31.13.71.0/24",
            "31.13.72.0/24",
            "31.13.73.0/24",
            "31.13.74.0/24",
            "31.13.75.0/24",
            "31.13.76.0/24",
            "31.13.77.0/24",
            "31.13.96.0/19",
            "31.13.66.0/24",
            "173.252.96.0/19",
            "69.63.178.0/24",
            "31.13.78.0/24",
            "31.13.79.0/24",
            "31.13.80.0/24",
            "31.13.82.0/24",
            "31.13.83.0/24",
            "31.13.84.0/24",
            "31.13.85.0/24",
            "31.13.86.0/24",
            "31.13.87.0/24",
            "31.13.88.0/24",
            "31.13.89.0/24",
            "31.13.91.0/24",
            "31.13.92.0/24",
            "31.13.93.0/24",
            "31.13.94.0/24",
            "31.13.95.0/24",
            "31.13.81.0/24",
            "179.60.192.0/22",
            "179.60.192.0/24",
            "179.60.193.0/24",
            "179.60.194.0/24",
            "179.60.195.0/24",
            "185.60.216.0/22",
            "45.64.40.0/22",
            "185.60.216.0/24",
            "185.60.217.0/24",
            "185.60.218.0/24",
            "185.60.219.0/24",
            "129.134.0.0/16",
            "157.240.0.0/16",
            "157.240.8.0/24",
            "157.240.0.0/24",
            "157.240.1.0/24",
            "157.240.2.0/24",
            "157.240.3.0/24",
            "157.240.5.0/24",
            "157.240.6.0/24",
            "157.240.7.0/24",
            "157.240.9.0/24",
            "157.240.10.0/24",
            "157.240.16.0/24",
            "157.240.19.0/24",
            "157.240.11.0/24",
            "157.240.12.0/24",
            "157.240.13.0/24",
            "157.240.14.0/24",
            "157.240.15.0/24",
            "157.240.17.0/24",
            "157.240.18.0/24",
            "157.240.20.0/24",
            "157.240.21.0/24",
            "157.240.22.0/24",
            "157.240.23.0/24",
            "157.240.0.0/17",
            "69.171.250.0/24",
            "204.15.20.0/22",
            "157.240.192.0/24",
            "157.240.198.0/24",
            "102.132.96.0/20",
            "102.132.96.0/24",
            "102.132.97.0/24",
            "157.240.26.0/24",
            "157.240.27.0/24",
            "157.240.28.0/24",
            "157.240.29.0/24",
            "157.240.30.0/24",
            "129.134.28.0/24",
            "129.134.29.0/24",
            "157.240.208.0/24",
            "157.240.193.0/24",
            "157.240.194.0/24",
            "157.240.195.0/24",
            "157.240.197.0/24",
            "157.240.196.0/24",
            "157.240.200.0/24",
            "157.240.201.0/24",
            "157.240.203.0/24",
            "157.240.204.0/24",
            "157.240.205.0/24",
            "157.240.206.0/24",
            "157.240.207.0/24",
            "157.240.209.0/24",
            "157.240.210.0/24",
            "157.240.211.0/24",
            "157.240.212.0/24",
            "157.240.213.0/24",
            "157.240.214.0/24",
            "157.240.215.0/24",
            "157.240.216.0/24",
            "157.240.222.0/24",
            "129.134.30.0/24",
            "129.134.31.0/24",
            "129.134.30.0/23",
            "129.134.25.0/24",
            "129.134.26.0/24",
            "129.134.27.0/24",
            "102.132.99.0/24",
            "102.132.101.0/24",
            "129.134.64.0/24",
            "129.134.65.0/24",
            "129.134.66.0/24",
            "129.134.67.0/24",
            "157.240.219.0/24",
            "157.240.217.0/24",
            "157.240.218.0/24",
            "157.240.199.0/24",
            "129.134.127.0/24",
            "157.240.223.0/24",
            "157.240.192.0/18",
            "157.240.221.0/24",
            "157.240.220.0/24",
            "173.252.88.0/21",
            "129.134.68.0/24",
            "129.134.69.0/24",
            "129.134.70.0/24",
            "157.240.24.0/24",
            "157.240.25.0/24",
            "102.132.100.0/24",
            "157.240.31.0/24",
            "157.240.224.0/24",
            "129.134.71.0/24",
            "157.240.225.0/24",
            "157.240.226.0/24",
            "157.240.227.0/24",
            "129.134.0.0/17",
            "129.134.72.0/24",
            "129.134.73.0/24",
            "129.134.74.0/24",
            "185.89.218.0/24",
            "185.89.219.0/24",
            "185.89.218.0/23",
            "157.240.228.0/24",
            "157.240.229.0/24",
            "129.134.76.0/24",
            "129.134.75.0/24",
            "157.240.239.0/24",
            "157.240.240.0/24",
            "157.240.241.0/24",
            "157.240.231.0/24",
            "157.240.232.0/24",
            "157.240.233.0/24",
            "157.240.234.0/24",
            "157.240.235.0/24",
            "157.240.236.0/24",
            "129.134.77.0/24",
            "129.134.78.0/24",
            "129.134.79.0/24",
            "157.240.237.0/24",
            "157.240.238.0/24",
            "157.240.242.0/24",
            "157.240.243.0/24",
            "129.134.112.0/24",
            "157.240.100.0/24",
            "157.240.98.0/24",
            "157.240.96.0/24",
            "157.240.99.0/24",
            "157.240.101.0/24",
            "129.134.113.0/24",
            "129.134.114.0/24",
            "157.240.97.0/24",
            "129.134.115.0/24",
            "157.240.244.0/24",
            "157.240.245.0/24",
            "157.240.246.0/24",
            "157.240.247.0/24",
            "157.240.248.0/24",
            "157.240.249.0/24",
            "157.240.250.0/24",
            "163.70.128.0/17",
            "163.77.128.0/17",
            "157.240.251.0/24",
            "157.240.252.0/24",
            "157.240.253.0/24",
            "147.75.208.0/20",
            "157.240.254.0/24",
            "185.89.219.0/24",
            "185.89.218.0/24",
            "185.89.218.0/23",
            "185.89.216.0/22",
            "147.75.208.0/20",
            "204.15.20.0/22",
            "69.63.176.0/20",
            "69.63.176.0/21",
            "69.63.184.0/21",
            "66.220.144.0/20",
            "69.63.176.0/20",
            "2620:0:1c00::/40",
            "2a03:2880::/32",
            "2a03:2880:fffe::/48",
            "2a03:2880:ffff::/48",
            "2620:0:1cff::/48",
            "2a03:2880:f001::/48",
            "2a03:2880:f003::/48",
            "2a03:2880:f004::/48",
            "2a03:2880:f005::/48",
            "2a03:2880:f006::/48",
            "2a03:2880:f007::/48",
            "2a03:2880:f008::/48",
            "2a03:2880:f00a::/48",
            "2a03:2880:f00c::/48",
            "2a03:2880:f00d::/48",
            "2a03:2880:f00e::/48",
            "2a03:2880:f00f::/48",
            "2a03:2880:f010::/48",
            "2a03:2880:f011::/48",
            "2a03:2880:f012::/48",
            "2a03:2880:f013::/48",
            "2a03:2880:f016::/48",
            "2a03:2880:f017::/48",
            "2a03:2880:f019::/48",
            "2a03:2880:f01b::/48",
            "2a03:2880:f01c::/48",
            "2a03:2880:f01f::/48",
            "2a03:2880:1000::/36",
            "2a03:2880:2000::/36",
            "2a03:2880:3000::/36",
            "2a03:2880:4000::/36",
            "2a03:2880:5000::/36",
            "2a03:2880:6000::/36",
            "2a03:2880:7000::/36",
            "2a03:2880:f021::/48",
            "2a03:2880:f023::/48",
            "2a03:2880:f024::/48",
            "2a03:2880:f027::/48",
            "2a03:2880:f028::/48",
            "2a03:2880:f029::/48",
            "2a03:2880:f02b::/48",
            "2a03:2880:f02c::/48",
            "2a03:2880:f02d::/48",
            "2a03:2880:f02e::/48",
            "2a03:2880:f02f::/48",
            "2a03:2880:f030::/48",
            "2a03:2880:f031::/48",
            "2a03:2880:f032::/48",
            "2a03:2880:f033::/48",
            "2a03:2880:f034::/48",
            "2a03:2880:f035::/48",
            "2a03:2880:f036::/48",
            "2a03:2880:f037::/48",
            "2a03:2880:f038::/48",
            "2a03:2880:f03a::/48",
            "2a03:2880:f03b::/48",
            "2a03:2880:f03d::/48",
            "2a03:2880:f03e::/48",
            "2a03:2880:f03f::/48",
            "2401:db00::/32",
            "2a03:2880::/36",
            "2a03:2880:f101::/48",
            "2a03:2880:f201::/48",
            "2a03:2880:f103::/48",
            "2a03:2880:f203::/48",
            "2a03:2880:f104::/48",
            "2a03:2880:f204::/48",
            "2a03:2880:f107::/48",
            "2a03:2880:f207::/48",
            "2a03:2880:f108::/48",
            "2a03:2880:f208::/48",
            "2a03:2880:f10a::/48",
            "2a03:2880:f20a::/48",
            "2a03:2880:f10d::/48",
            "2a03:2880:f20d::/48",
            "2a03:2880:f10e::/48",
            "2a03:2880:f20e::/48",
            "2a03:2880:f10f::/48",
            "2a03:2880:f20f::/48",
            "2a03:2880:f110::/48",
            "2a03:2880:f210::/48",
            "2a03:2880:f111::/48",
            "2a03:2880:f211::/48",
            "2a03:2880:f112::/48",
            "2a03:2880:f212::/48",
            "2a03:2880:f116::/48",
            "2a03:2880:f216::/48",
            "2a03:2880:f117::/48",
            "2a03:2880:f217::/48",
            "2a03:2880:f119::/48",
            "2a03:2880:f219::/48",
            "2a03:2880:f11f::/48",
            "2a03:2880:f21f::/48",
            "2a03:2880:f121::/48",
            "2a03:2880:f221::/48",
            "2a03:2880:f123::/48",
            "2a03:2880:f223::/48",
            "2a03:2880:f10c::/48",
            "2a03:2880:f20c::/48",
            "2a03:2880:f105::/48",
            "2a03:2880:f205::/48",
            "2a03:2880:f106::/48",
            "2a03:2880:f206::/48",
            "2a03:2880:f11b::/48",
            "2a03:2880:f21b::/48",
            "2a03:2880:f113::/48",
            "2a03:2880:f213::/48",
            "2a03:2880:f11c::/48",
            "2a03:2880:f21c::/48",
            "2a03:2880:f128::/48",
            "2a03:2880:f228::/48",
            "2a03:2880:f02a::/48",
            "2a03:2880:f12a::/48",
            "2a03:2880:f22a::/48",
            "2a03:2880:f12f::/48",
            "2a03:2880:f22f::/48",
            "2a03:2880:f124::/48",
            "2a03:2880:f127::/48",
            "2a03:2880:f129::/48",
            "2a03:2880:f12b::/48",
            "2a03:2880:f12c::/48",
            "2a03:2880:f12d::/48",
            "2a03:2880:f12e::/48",
            "2a03:2880:f130::/48",
            "2a03:2880:f131::/48",
            "2a03:2880:f132::/48",
            "2a03:2880:f133::/48",
            "2a03:2880:f134::/48",
            "2a03:2880:f135::/48",
            "2a03:2880:f136::/48",
            "2a03:2880:f137::/48",
            "2a03:2880:f138::/48",
            "2a03:2880:f13a::/48",
            "2a03:2880:f13b::/48",
            "2a03:2880:f13d::/48",
            "2a03:2880:f13e::/48",
            "2a03:2880:f13f::/48",
            "2a03:2880:f224::/48",
            "2a03:2880:f227::/48",
            "2a03:2880:f229::/48",
            "2a03:2880:f22b::/48",
            "2a03:2880:f22c::/48",
            "2a03:2880:f22d::/48",
            "2a03:2880:f22e::/48",
            "2a03:2880:f230::/48",
            "2a03:2880:f231::/48",
            "2a03:2880:f232::/48",
            "2a03:2880:f233::/48",
            "2a03:2880:f234::/48",
            "2a03:2880:f235::/48",
            "2a03:2880:f236::/48",
            "2a03:2880:f237::/48",
            "2a03:2880:f238::/48",
            "2a03:2880:f23a::/48",
            "2a03:2880:f23b::/48",
            "2a03:2880:f23d::/48",
            "2a03:2880:f23e::/48",
            "2a03:2880:f23f::/48",
            "2a03:2880:f0ff::/48",
            "2a03:2880:f1ff::/48",
            "2a03:2880:f2ff::/48",
            "2a03:2880:f044::/48",
            "2a03:2880:f144::/48",
            "2a03:2880:f244::/48",
            "2a03:2880:f042::/48",
            "2a03:2880:f043::/48",
            "2a03:2880:f045::/48",
            "2a03:2880:f046::/48",
            "2a03:2880:f047::/48",
            "2a03:2880:f048::/48",
            "2a03:2880:f04a::/48",
            "2a03:2880:f04c::/48",
            "2a03:2880:f04b::/48",
            "2a03:2880:f04d::/48",
            "2a03:2880:f259::/48",
            "2a03:2880:f258::/48",
            "2a03:2880:f257::/48",
            "2a03:2880:f256::/48",
            "2a03:2880:f255::/48",
            "2a03:2880:f254::/48",
            "2a03:2880:f253::/48",
            "2a03:2880:f252::/48",
            "2a03:2880:f250::/48",
            "2a03:2880:f24f::/48",
            "2a03:2880:f24d::/48",
            "2a03:2880:f24e::/48",
            "2a03:2880:f24c::/48",
            "2a03:2880:f24b::/48",
            "2a03:2880:f24a::/48",
            "2a03:2880:f248::/48",
            "2a03:2880:f247::/48",
            "2a03:2880:f246::/48",
            "2a03:2880:f245::/48",
            "2a03:2880:f243::/48",
            "2a03:2880:f242::/48",
            "2a03:2880:f241::/48",
            "2a03:2880:f240::/48",
            "2a03:2880:f159::/48",
            "2a03:2880:f158::/48",
            "2a03:2880:f157::/48",
            "2a03:2880:f156::/48",
            "2a03:2880:f155::/48",
            "2a03:2880:f154::/48",
            "2a03:2880:f153::/48",
            "2a03:2880:f152::/48",
            "2a03:2880:f150::/48",
            "2a03:2880:f14f::/48",
            "2a03:2880:f14e::/48",
            "2a03:2880:f14d::/48",
            "2a03:2880:f14c::/48",
            "2a03:2880:f14b::/48",
            "2a03:2880:f14a::/48",
            "2a03:2880:f148::/48",
            "2a03:2880:f147::/48",
            "2a03:2880:f146::/48",
            "2a03:2880:f145::/48",
            "2a03:2880:f143::/48",
            "2a03:2880:f142::/48",
            "2a03:2880:f141::/48",
            "2a03:2880:f140::/48",
            "2a03:2880:f059::/48",
            "2a03:2880:f058::/48",
            "2a03:2880:f057::/48",
            "2a03:2880:f056::/48",
            "2a03:2880:f055::/48",
            "2a03:2880:f054::/48",
            "2a03:2880:f053::/48",
            "2a03:2880:f052::/48",
            "2a03:2880:f050::/48",
            "2a03:2880:f04f::/48",
            "2a03:2880:f04e::/48",
            "2a03:2880:ff0b::/48",
            "2a03:2880:ff0c::/48",
            "2a03:2880:f040::/48",
            "2a03:2880:f041::/48",
            "2a03:2880:f0fc::/48",
            "2a03:2880:f0fd::/48",
            "2a03:2880:f0fc::/47",
            "2a03:2880:f1fc::/48",
            "2a03:2880:f1fd::/48",
            "2a03:2880:f1fc::/47",
            "2a03:2880:ff08::/48",
            "2a03:2880:ff09::/48",
            "2a03:2880:ff0a::/48",
            "2a03:2880:f05e::/48",
            "2a03:2880:f15e::/48",
            "2a03:2880:f25e::/48",
            "2620:0:1cfa::/48",
            "2a03:2880:f05b::/48",
            "2a03:2880:f05a::/48",
            "2a03:2880:f25a::/48",
            "2a03:2880:f15c::/48",
            "2a03:2880:f000::/36",
            "2a03:2880:f05d::/48",
            "2a03:2880:f25c::/48",
            "2a03:2880:f05c::/48",
            "2a03:2880:f260::/48",
            "2a03:2880:f060::/48",
            "2a03:2880:f160::/48",
            "2a03:2880:f15d::/48",
            "2a03:2880:f25b::/48",
            "2a03:2880:f25d::/48",
            "2a03:2880:f15b::/48",
            "2a03:2880:f15a::/48",
            "2a03:2880:f161::/48",
            "2a03:2880:f061::/48",
            "2a03:2880:f261::/48",
            "2a03:2881::/32",
            "2a03:2881::/48",
            "2a03:2881:1::/48",
            "2a03:2881:2::/48",
            "2a03:2881:3::/48",
            "2a03:2880:f162::/48",
            "2a03:2880:f262::/48",
            "2a03:2881:4000::/48",
            "2a03:2881:4003::/48",
            "2a03:2881:4001::/48",
            "2a03:2881:4002::/48",
            "2a03:2880:f065::/48",
            "2a03:2880:f163::/48",
            "2a03:2880:f066::/48",
            "2a03:2880:f263::/48",
            "2a03:2880:f264::/48",
            "2a03:2880:f164::/48",
            "2a03:2880:f067::/48",
            "2a03:2880:f165::/48",
            "2a03:2880:f265::/48",
            "2a03:2880:f068::/48",
            "2a03:2881:4004::/48",
            "2a03:2880:f06a::/48",
            "2a03:2880:f266::/48",
            "2a03:2880:f166::/48",
            "2a03:2880:f267::/48",
            "2a03:2880:f06b::/48",
            "2a03:2880:f167::/48",
            "2a03:2881:4006::/48",
            "2a03:2881:7::/48",
            "2a03:2881:9::/48",
            "2a03:2881:8::/48",
            "2a03:2881:4::/48",
            "2a03:2881:6::/48",
            "2a03:2881:5::/48",
            "2a03:2881:a::/48",
            "2a03:2880:f268::/48",
            "2a03:2880:f06d::/48",
            "2a03:2880:f168::/48",
            "2a03:2881:b::/48",
            "2a03:2881:c::/48",
            "2a03:2881:4007::/48",
            "2a03:2880:f269::/48",
            "2a03:2880:f169::/48",
            "2a03:2880:f06f::/48",
            "2a03:2880:f26a::/48",
            "2a03:2880:f16a::/48",
            "2a03:2880:f070::/48",
            "2a03:2881:d::/48",
            "2a03:2881:e::/48",
            "2a03:2880:f071::/48",
            "2a03:2880:f16b::/48",
            "2a03:2880:f26b::/48",
            "2a03:2881:4008::/48",
            "2a03:2881:10::/48",
            "2a03:2881:f::/48",
            "2a03:2881:11::/48",
            "2a03:2880:f26c::/48",
            "2a03:2880:f16c::/48",
            "2a03:2880:f073::/48",
            "2a03:2880:f16d::/48",
            "2a03:2880:f074::/48",
            "2a03:2880:f26d::/48",
            "2a03:2881:4009::/48",
            "2a03:2880:f26e::/48",
            "2a03:2880:f16e::/48",
            "2a03:2880:f076::/48",
            "2a03:2880:f16f::/48",
            "2a03:2880:f26f::/48",
            "2a03:2880:f077::/48",
            "2a03:2881:12::/48",
            "2a03:2881:13::/48",
            "2a03:2881:17::/48",
            "2a03:2881:15::/48",
            "2a03:2881:18::/48",
            "2a03:2881:14::/48",
            "2a03:2881:16::/48",
            "2a03:2881:19::/48",
            "2a03:2881:4005::/48",
            "2a03:2880:f078::/48",
            "2a03:2880:f170::/48",
            "2a03:2880:f270::/48",
            "2a03:2881:400a::/48",
            "2a03:2881:400c::/48",
            "2a03:2881:400b::/48",
            "2a03:2881:400d::/48",
            "2a03:2881:1a::/48",
            "2a03:2881:1c::/48",
            "2a03:2881:1b::/48",
            "2a03:2880:f271::/48",
            "2a03:2880:f07d::/48",
            "2a03:2880:f171::/48",
            "2a03:2880:f07e::/48",
            "2a03:2880:f172::/48",
            "2a03:2880:f272::/48",
            "2a03:2880:f080::/48",
            "2a03:2880:f173::/48",
            "2a03:2880:f273::/48",
            "2a03:2880:f081::/48",
            "2a03:2880:f174::/48",
            "2a03:2880:f274::/48",
            "2a03:2880:f175::/48",
            "2a03:2880:f275::/48",
            "2a03:2880:f082::/48",
            "2a03:2880:f176::/48",
            "2a03:2880:f276::/48",
            "2a03:2880:f083::/48",
            "2a03:2880:f277::/48",
            "2a03:2880:f084::/48",
            "2a03:2880:f177::/48",
            "2a03:2881:1e::/48",
            "2a03:2880:f085::/48",
            "2a03:2880:f178::/48",
            "2a03:2880:f278::/48",
            "2a03:2880:f179::/48",
            "2a03:2880:f086::/48",
            "2a03:2880:f279::/48",
            "2a03:2880:f17a::/48",
            "2a03:2880:f08a::/48",
            "2a03:2880:f27a::/48",
            "2a03:2881:48::/45",
            "2a10:f781:10:cee0::/64",
            "2a03:83e0::/32",
        ]

        const twitter = [
            "199.16.156.0/22",
            "199.59.148.0/22",
            "192.133.76.0/22",
        ]

        const bing = [
            "157.55.39.0/24",
            "207.46.13.0/24",
            "40.77.167.0/24",
            "13.66.139.0/24",
            "13.66.144.0/24",
            "52.167.144.0/24",
            "13.67.10.16/28",
            "13.69.66.240/28",
            "13.71.172.224/28",
            "139.217.52.0/28",
            "191.233.204.224/28",
            "20.36.108.32/28",
            "20.43.120.16/28",
            "40.79.131.208/28",
            "40.79.186.176/28",
            "52.231.148.0/28",
            "20.79.107.240/28",
            "51.105.67.0/28",
            "20.125.163.80/28",
            "40.77.188.0/22",
            "65.55.210.0/24",
            "199.30.24.0/23",
            "40.77.202.0/24",
            "40.77.139.0/25",
            "20.74.197.0/28",
        ]

        const pinterest = [
            "54.236.1.1/32",
            "54.236.1.2/31",
            "54.236.1.4/30",
            "54.236.1.8/29",
            "54.236.1.16/28",
            "54.236.1.32/27",
            "54.236.1.64/26",
            "54.236.1.128/25",
        ]

        const hotjar = [
            "18.203.61.76",
            "18.203.176.135",
            "52.17.197.221",
        ]

        const alexa = [
            "204.236.235.245",
            "75.101.186.145",
        ]

        const amazon = [
            "18.207.141.103",
            "52.1.113.12",
        ]

        const baidu = [
            "180.76.15.0/24",
            "119.63.196.0/24",
            "115.239.212.0/24",
            "119.63.199.0/24",
            "122.81.208.0/22",
            "123.125.71.0/24",
            "180.76.4.0/24",
            "180.76.5.0/24",
            "180.76.6.0/24",
            "185.10.104.0/24",
            "220.181.108.0/24",
            "220.181.51.0/24",
            "111.13.102.0/24",
            "123.125.67.144/29",
            "123.125.67.152/31",
            "61.135.169.0/24",
            "123.125.68.68/30",
            "123.125.68.72/29",
            "123.125.68.80/28",
            "123.125.68.96/30",
            "202.46.48.0/20",
            "220.181.38.0/24",
            "123.125.68.80/30",
            "123.125.68.84/31",
            "123.125.68.0/24",
        ]

        const duckduckgo = [
            "20.191.45.212",
            "40.88.21.235",
            "40.76.173.151",
            "40.76.163.7",
            "20.185.79.47",
            "52.142.26.175",
            "20.185.79.15",
            "52.142.24.149",
            "40.76.162.208",
            "40.76.163.23",
            "40.76.162.191",
            "40.76.162.247",
        ]

        const yahoo = [
            "5.255.250.0/24",
            "37.9.87.0/24",
            "67.195.37.0/24",
            "67.195.50.0/24",
            "67.195.110.0/24",
            "67.195.111.0/24",
            "67.195.112.0/23",
            "67.195.114.0/24",
            "67.195.115.0/24",
            "68.180.224.0/21",
            "72.30.132.0/24",
            "72.30.142.0/24",
            "72.30.161.0/24",
            "72.30.196.0/24",
            "72.30.198.0/24",
            "74.6.254.0/24",
            "74.6.8.0/24",
            "74.6.13.0/24",
            "74.6.17.0/24",
            "74.6.18.0/24",
            "74.6.22.0/24",
            "74.6.27.0/24",
            "74.6.168.0/24",
            "77.88.5.0/24",
            "77.88.47.0/24",
            "93.158.161.0/24",
            "98.137.72.0/24",
            "98.137.206.0/24",
            "98.137.207.0/24",
            "98.139.168.0/24",
            "114.111.95.0/24",
            "124.83.159.0/24",
            "124.83.179.0/24",
            "124.83.223.0/24",
            "141.8.144.0/24",
            "183.79.63.0/24",
            "183.79.92.0/24",
            "203.216.255.0/24",
            "211.14.11.0/24",
        ]

        const yandex = [
            "100.43.90.0/24",
            "37.9.115.0/24",
            "37.140.165.0/24",
            "77.88.22.0/25",
            "77.88.29.0/24",
            "77.88.31.0/24",
            "77.88.59.0/24",
            "84.201.146.0/24",
            "84.201.148.0/24",
            "84.201.149.0/24",
            "87.250.243.0/24",
            "87.250.253.0/24",
            "93.158.147.0/24",
            "93.158.148.0/24",
            "93.158.151.0/24",
            "93.158.153.0/32",
            "95.108.128.0/24",
            "95.108.138.0/24",
            "95.108.150.0/23",
            "95.108.158.0/24",
            "95.108.156.0/24",
            "95.108.188.128/25",
            "95.108.234.0/24",
            "95.108.248.0/24",
            "100.43.80.0/24",
            "130.193.62.0/24",
            "141.8.153.0/24",
            "178.154.165.0/24",
            "178.154.166.128/25",
            "178.154.173.29",
            "178.154.200.158",
            "178.154.202.0/24",
            "178.154.205.0/24",
            "178.154.239.0/24",
            "178.154.243.0/24",
            "37.9.84.253",
            "199.21.99.99",
            "178.154.162.29",
            "178.154.203.251",
            "178.154.211.250",
            "178.154.171.0/24",
            "178.154.200.0/24",
            "178.154.244.0/24",
            "178.154.246.0/24",
            "95.108.181.0/24",
            "95.108.246.252",
            "5.45.254.0/24",
            "5.255.253.0/24",
            "37.140.141.0/24",
            "37.140.188.0/24",
            "100.43.81.0/24",
            "100.43.85.0/24",
            "100.43.91.0/24",
            "199.21.99.0/24",
            "2a02:6b8:b000::/32",
            "2a02:6b8:b010::/32",
            "2a02:6b8:b011::/32",
            "2a02:6b8:c0e::/32",
        ]

        const sogou = [
            "220.181.125.0/24",
            "123.126.51.64/27",
            "123.126.51.96/28",
            "123.126.68.25",
            "61.135.189.74",
            "61.135.189.75",
        ]

        const youdao = [
            "61.135.249.200/29",
            "61.135.249.208/28",
        ]

        let customExclusionList = []

        // if wpmDataLayer.general.server_2_server.ip_exclude_list is array
        if (Array.isArray(wpmDataLayer.general.server_2_server.ip_exclude_list)) {
            customExclusionList = wpmDataLayer.general.server_2_server.ip_exclude_list
        }

        return blacklist.concat(
            google,
            facebook,
            twitter,
            bing,
            pinterest,
            hotjar,
            alexa,
            amazon,
            baidu,
            duckduckgo,
            yahoo,
            yandex,
            sogou,
            youdao,
            customExclusionList,
        )
    }

}(window.wpm = window.wpm || {}, jQuery))