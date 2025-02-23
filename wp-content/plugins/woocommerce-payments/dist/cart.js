(() => {
    var e = {
        n: t => {
            var s = t && t.__esModule ? () => t.default : () => t;
            return e.d(s, {
                a: s
            }), s
        },
        d: (t, s) => {
            for (var o in s) e.o(s, o) && !e.o(t, o) && Object.defineProperty(t, o, {
                enumerable: !0,
                get: s[o]
            })
        }
    };
    e.g = function() {
        if ("object" == typeof globalThis) return globalThis;
        try {
            return this || new Function("return this")()
        } catch (e) {
            if ("object" == typeof window) return window
        }
    }(), e.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t), (() => {
        var t;
        e.g.importScripts && (t = e.g.location + "");
        var s = e.g.document;
        if (!t && s && (s.currentScript && (t = s.currentScript.src), !t)) {
            var o = s.getElementsByTagName("script");
            o.length && (t = o[o.length - 1].src)
        }
        if (!t) throw new Error("Automatic publicPath is not supported in this browser");
        t = t.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/"), e.p = t
    })(), e.p = window.wcpayAssets.url, (() => {
        "use strict";
        window.wp.domReady;
        const t = e => "undefined" != typeof wcpayConfig ? wcpayConfig[e] : s(e),
            s = e => {
                let t = null;
                if ("undefined" != typeof wcpay_upe_config) t = wcpay_upe_config;
                else {
                    if ("object" != typeof wc || void 0 === wc.wcSettings) return null;
                    t = wc.wcSettings.getSetting("woocommerce_payments_data") || {}
                }
                return t[e] || null
            },
            o = e => "object" == typeof wcpayPaymentRequestParams && wcpayPaymentRequestParams.hasOwnProperty(e) ? wcpayPaymentRequestParams[e] : null,
            n = function(e, t) {
                let s = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : "wcpay_";
                return e.toString().replace("%%endpoint%%", s + t)
            };
        const a = () => {
            return e = void 0, s = void 0, a = function*() {
                var e, s, n;
                let a = (() => {
                    const e = document.cookie.split(";");
                    for (let t = 0; t < e.length; t++) {
                        let s = e[t];
                        for (;
                            " " === s.charAt(0);) s = s.substring(1, s.length);
                        if (0 === s.indexOf("tk_ai=")) return s.substring(6, s.length)
                    }
                })();
                if (!a) {
                    const i = null !== (e = t("platformTrackerNonce")) && void 0 !== e ? e : null === (s = o("nonce")) || void 0 === s ? void 0 : s.platform_tracker,
                        r = null !== (n = t("ajaxUrl")) && void 0 !== n ? n : o("ajax_url"),
                        c = new FormData;
                    c.append("tracksNonce", i), c.append("action", "get_identity");
                    try {
                        const e = yield fetch(r, {
                            method: "post",
                            body: c
                        });
                        if (!e.ok) return;
                        const t = yield e.json();
                        if (!t.success || !t.data) return;
                        a = t.data._ui
                    } catch (e) {
                        return
                    }
                }
                const i = {
                    _ut: "anon",
                    _ui: a
                };
                return JSON.stringify(i)
            }, new((n = void 0) || (n = Promise))((function(t, o) {
                function i(e) {
                    try {
                        c(a.next(e))
                    } catch (e) {
                        o(e)
                    }
                }

                function r(e) {
                    try {
                        c(a.throw(e))
                    } catch (e) {
                        o(e)
                    }
                }

                function c(e) {
                    var s;
                    e.done ? t(e.value) : (s = e.value, s instanceof n ? s : new n((function(e) {
                        e(s)
                    }))).then(i, r)
                }
                c((a = a.apply(e, s || [])).next())
            }));
            var e, s, n, a
        };

        function i(e) {
            let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "",
                s = arguments.length > 2 ? arguments[2] : void 0;
            for (const o in e) {
                const n = e[o],
                    a = t ? t + "[" + o + "]" : o;
                "string" == typeof n || "number" == typeof n ? s.append(a, n) : "object" == typeof n && i(n, a, s)
            }
            return s
        }
        async function r(e, t, s) {
            const o = i(t, "", new FormData),
                n = await fetch(e, {
                    method: "POST",
                    body: o,
                    ...s
                });
            return await n.json()
        }
        const c = window.wp.element,
            l = window.React,
            d = window.wp.i18n;

        function u(e) {
            window.WooPayConnect || (window.WooPayConnect = {}), window.WooPayConnect.iframeInjectedState = e
        }
        const h = () => {
                const e = (0, l.useRef)(),
                    [s, o] = (0, l.useState)("");
                return (0, l.useEffect)((() => {
                    (async () => {
                        const e = t("testMode"),
                            s = t("woopayHost"),
                            n = new URLSearchParams({
                                testMode: e,
                                source_url: window.location.href
                            }),
                            i = await a();
                        i && n.append("tracksUserIdentity", i), o(`${s}/connect/?${n.toString()}`)
                    })()
                }), []), (0, l.useEffect)((() => {
                    if (!e.current) return;
                    const s = e.current;
                    s.addEventListener("load", (() => {
                        u(2), window.dispatchEvent(new MessageEvent("message", {
                            source: window,
                            origin: t("woopayHost"),
                            data: {
                                action: "get_iframe_post_message_success",
                                value: e => s.contentWindow.postMessage(e, t("woopayHost"))
                            }
                        }))
                    }))
                }), [s]), (0, c.createElement)("iframe", {
                    ref: e,
                    id: "woopay-connect-iframe",
                    src: s,
                    style: {
                        height: 0,
                        width: 0,
                        border: "none",
                        margin: 0,
                        padding: 0,
                        overflow: "hidden",
                        display: "block",
                        visibility: "hidden",
                        position: "fixed",
                        pointerEvents: "none",
                        userSelect: "none"
                    },
                    title: (0, d.__)("WooPay Connect Direct Checkout", "woocommerce-payments")
                })
            },
            p = window.ReactDOM;
        var y = e.n(p);
        const w = class {
                iframePostMessage = null;
                listeners = {};
                constructor() {
                    this.listeners = {
                        getIframePostMessageCallback: () => {}
                    }, this.removeMessageListener = this.attachMessageListener(), this.injectWooPayConnectIframe()
                }
                attachMessageListener() {
                    const e = e => {
                        t("woopayHost").startsWith(e.origin) && this.callbackFn(e.data)
                    };
                    return window.addEventListener("message", e), () => {
                        window.removeEventListener("message", e)
                    }
                }
                detachMessageListener() {
                    "function" == typeof this.removeMessageListener && this.removeMessageListener()
                }
                injectWooPayConnectIframe() {
                    const e = (null === (s = window) || void 0 === s || null === (o = s.WooPayConnect) || void 0 === o ? void 0 : o.iframeInjectedState) || 0;
                    var s, o;
                    if (2 === e) {
                        const e = document.querySelector("#woopay-connect-iframe");
                        return void(e && (this.iframePostMessage = Promise.resolve((s => {
                            e.contentWindow.postMessage(s, t("woopayHost"))
                        }))))
                    }
                    if (1 === e) return void(this.iframePostMessage = new Promise((e => {
                        this.listeners.getIframePostMessageCallback = e
                    })));
                    u(1);
                    const n = document.createElement("div");
                    n.style.visibility = "hidden", n.style.position = "fixed", n.style.height = "0", n.style.width = "0", n.style.bottom = "0", n.style.right = "0", n.id = "woopay-connect-iframe-container", document.body.appendChild(n);
                    const a = this;
                    this.iframePostMessage = new Promise((e => {
                        a.listeners.getIframePostMessageCallback = e
                    })), y().render((0, c.createElement)(h, null), n)
                }
                injectTemporaryWooPayConnectIframe() {
                    let e;
                    const s = new Promise((t => {
                            e = t
                        })),
                        o = document.createElement("iframe");
                    return o.id = "temp-woopay-connect-iframe", o.src = t("woopayHost") + "/connect/", o.height = 0, o.width = 0, o.border = "none", o.margin = 0, o.padding = 0, o.overflow = "hidden", o.display = "block", o.visibility = "hidden", o.position = "fixed", o.pointerEvents = "none", o.userSelect = "none", o.addEventListener("load", (() => {
                        e((e => o.contentWindow.postMessage(e, t("woopayHost"))))
                    })), document.body.appendChild(o), {
                        resolvePostMessagePromise: s,
                        removeTemporaryIframe: () => {
                            document.body.removeChild(o)
                        }
                    }
                }
                async sendMessageAndListenWith(e, t) {
                    const s = new Promise((e => {
                        this.listeners[t] = e
                    }));
                    return (await this.iframePostMessage)(e), await s
                }
                callbackFn(e) {
                    "get_iframe_post_message_success" === e.action && this.listeners.getIframePostMessageCallback(e.value)
                }
            },
            m = class extends w {
                constructor() {
                    super(), this.listeners = { ...this.listeners,
                        getIsUserLoggedInCallback: () => {}
                    }
                }
                async isUserLoggedIn() {
                    return await this.sendMessageAndListenWith({
                        action: "getIsUserLoggedIn"
                    }, "getIsUserLoggedInCallback")
                }
                callbackFn(e) {
                    super.callbackFn(e), "get_is_user_logged_in_success" === e.action && this.listeners.getIsUserLoggedInCallback(e.value)
                }
            },
            g = class extends w {
                constructor() {
                    super(), this.listeners = { ...this.listeners,
                        setRedirectSessionDataCallback: () => {},
                        setTempThirdPartyCookieCallback: () => {},
                        getIsThirdPartyCookiesEnabledCallback: () => {},
                        setPreemptiveSessionDataCallback: () => {}
                    }
                }
                async isWooPayThirdPartyCookiesEnabled() {
                    const {
                        resolvePostMessagePromise: e,
                        removeTemporaryIframe: t
                    } = this.injectTemporaryWooPayConnectIframe(), s = new Promise((e => {
                        this.listeners.setTempThirdPartyCookieCallback = e
                    })), o = await e;
                    if (o({
                            action: "setTempThirdPartyCookie"
                        }), !await s) return !1;
                    const n = new Promise((e => {
                        this.listeners.getIsThirdPartyCookiesEnabledCallback = e
                    }));
                    o({
                        action: "getIsThirdPartyCookiesEnabled"
                    });
                    const a = await n;
                    return t(), a
                }
                async sendRedirectSessionDataToWooPay(e) {
                    return await super.sendMessageAndListenWith({
                        action: "setRedirectSessionData",
                        value: e
                    }, "setRedirectSessionDataCallback")
                }
                async setPreemptiveSessionData(e) {
                    return await super.sendMessageAndListenWith({
                        action: "setPreemptiveSessionData",
                        value: e
                    }, "setPreemptiveSessionDataCallback")
                }
                callbackFn(e) {
                    switch (super.callbackFn(e), e.action) {
                        case "set_redirect_session_data_success":
                            this.listeners.setRedirectSessionDataCallback(e.value);
                            break;
                        case "set_redirect_session_data_error":
                            this.listeners.setRedirectSessionDataCallback({
                                is_error: !0
                            });
                            break;
                        case "set_temp_third_party_cookie_success":
                            this.listeners.setTempThirdPartyCookieCallback(e.value);
                            break;
                        case "get_is_third_party_cookies_enabled_success":
                            this.listeners.getIsThirdPartyCookiesEnabledCallback(e.value);
                            break;
                        case "set_preemptive_session_data_success":
                            this.listeners.setPreemptiveSessionDataCallback(e.value);
                            break;
                        case "set_preemptive_session_data_error":
                            this.listeners.setPreemptiveSessionDataCallback({
                                is_error: !0
                            })
                    }
                }
            },
            v = class {
                static userConnect;
                static sessionConnect;
                static encryptedSessionDataPromise;
                static redirectElements = {
                    CLASSIC_CART_PROCEED_BUTTON: ".wc-proceed-to-checkout .checkout-button",
                    BLOCKS_CART_PROCEED_BUTTON: ".wp-block-woocommerce-proceed-to-checkout-block"
                };
                static init() {
                    this.getSessionConnect()
                }
                static getUserConnect() {
                    return this.userConnect || (this.userConnect = new m), this.userConnect
                }
                static getSessionConnect() {
                    return this.sessionConnect || (this.sessionConnect = new g), this.sessionConnect
                }
                static teardown() {
                    var e, t;
                    null === (e = this.sessionConnect) || void 0 === e || e.detachMessageListener(), null === (t = this.userConnect) || void 0 === t || t.detachMessageListener(), this.sessionConnect = null, this.userConnect = null
                }
                static isWooPayDirectCheckoutEnabled() {
                    return t("isWooPayDirectCheckoutEnabled")
                }
                static async isUserLoggedIn() {
                    return this.getUserConnect().isUserLoggedIn()
                }
                static async isWooPayThirdPartyCookiesEnabled() {
                    return this.getSessionConnect().isWooPayThirdPartyCookiesEnabled()
                }
                static async getWooPayCheckoutUrl() {
                    try {
                        let e;
                        if (e = this.isEncryptedSessionDataPrefetched() ? await this.encryptedSessionDataPromise : await this.getEncryptedSessionData(), !this.isValidEncryptedSessionData(e)) throw new Error("Could not retrieve encrypted session data from store.");
                        const t = await this.getSessionConnect().sendRedirectSessionDataToWooPay(e);
                        if (null == t || !t.redirect_url) throw new Error("Could not retrieve WooPay checkout URL.");
                        const {
                            redirect_url: s
                        } = t;
                        if (!this.validateRedirectUrl(s, "platform_checkout_key")) throw new Error("Invalid WooPay session URL: " + s);
                        return t.redirect_url
                    } catch (e) {
                        throw new Error(e.message)
                    }
                }
                static isValidEncryptedSessionData(e) {
                    var t, s, o;
                    return e && (null == e ? void 0 : e.blog_id) && (null == e || null === (t = e.data) || void 0 === t ? void 0 : t.session) && (null == e || null === (s = e.data) || void 0 === s ? void 0 : s.iv) && (null == e || null === (o = e.data) || void 0 === o ? void 0 : o.hash)
                }
                static async getWooPayMinimumSessionUrl() {
                    const e = await this.getWooPayMinimumSesssionDataFromMerchant();
                    if (!1 === (null == e ? void 0 : e.success)) throw new Error("Could not retrieve redirect data from merchant.");
                    if (!this.isValidEncryptedSessionData(e)) throw new Error("Invalid encrypted session data.");
                    const s = t("testMode"),
                        o = new URLSearchParams({
                            checkout_redirect: 1,
                            blog_id: e.blog_id,
                            session: e.data.session,
                            iv: e.data.iv,
                            hash: e.data.hash,
                            testMode: s,
                            source_url: window.location.href
                        }),
                        n = await a();
                    return n && o.append("tracksUserIdentity", n), t("woopayHost") + "/woopay/?" + o.toString()
                }
                static getCheckoutRedirectElements() {
                    const e = [],
                        t = t => {
                            const s = document.querySelector(t);
                            s && e.push(s)
                        };
                    return t(this.redirectElements.CLASSIC_CART_PROCEED_BUTTON), t(this.redirectElements.BLOCKS_CART_PROCEED_BUTTON), e
                }
                static getClassicProceedToCheckoutButton() {
                    return document.querySelector(this.redirectElements.CLASSIC_CART_PROCEED_BUTTON)
                }
                static redirectToWooPay(e) {
                    let t = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
                    e.forEach((e => {
                        const s = {
                            is_loading: !1
                        };
                        e.addEventListener("click", (async o => {
                            if (s.is_loading) return void o.preventDefault();
                            let n;
                            var a;
                            if (s.is_loading = !0, (e => {
                                    var t, s;
                                    const o = e.classList.contains("checkout-button"),
                                        n = null === (t = e.parentElement) || void 0 === t || null === (s = t.classList) || void 0 === s ? void 0 : s.contains("wc-proceed-to-checkout");
                                    return o && n
                                })(e) && (e => {
                                    const t = document.createElement("span");
                                    t.classList.add("wc-block-components-spinner"), t.style.position = "relative", t.style.fontSize = "unset", e.innerHTML = "&nbsp;", e.classList.remove("wc-forward"), e.appendChild(t)
                                })(e), n = "a" === e.tagName.toLowerCase() ? e.href : null === (a = e.querySelector("a")) || void 0 === a ? void 0 : a.href, n) {
                                o.preventDefault();
                                try {
                                    let e = "";
                                    e = t ? await this.getWooPayCheckoutUrl() : await this.getWooPayMinimumSessionUrl(), this.teardown(), window.location.href = e
                                } catch (e) {
                                    console.warn(e), this.teardown(), window.location.href = n
                                }
                            } else this.teardown()
                        }))
                    }))
                }
                static async getEncryptedSessionData() {
                    return r(n(t("wcAjaxUrl"), "get_woopay_session"), {
                        _ajax_nonce: t("woopaySessionNonce")
                    })
                }
                static async getWooPayMinimumSesssionDataFromMerchant() {
                    return t("woopayMinimumSessionData") ? t("woopayMinimumSessionData") : r(n(t("wcAjaxUrl"), "get_woopay_minimum_session_data"), {
                        _ajax_nonce: t("woopaySessionNonce")
                    })
                }
                static validateRedirectUrl(e, s) {
                    try {
                        const o = new URL(e);
                        return !(o.origin !== t("woopayHost") || !o.searchParams.has(s))
                    } catch (e) {
                        return !1
                    }
                }
                static maybePrefetchEncryptedSessionData() {
                    var e, t, s;
                    const o = null === (e = window) || void 0 === e || null === (t = e.wcpayWooPayDirectCheckout) || void 0 === t || null === (s = t.params) || void 0 === s ? void 0 : s.is_product_page;
                    void 0 === o || o || (this.encryptedSessionDataPromise = new Promise((e => {
                        e(this.getEncryptedSessionData())
                    })))
                }
                static setEncryptedSessionDataAsNotPrefetched() {
                    this.encryptedSessionDataPromise = null
                }
                static isEncryptedSessionDataPrefetched() {
                    var e;
                    return "function" == typeof(null === (e = this.encryptedSessionDataPromise) || void 0 === e ? void 0 : e.then)
                }
            },
            f = () => {
                ! function(e) {
                    let s = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                        n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2];
                    var a, i, r;
                    const c = null !== (a = t("platformTrackerNonce")) && void 0 !== a ? a : null === (i = o("nonce")) || void 0 === i ? void 0 : i.platform_tracker,
                        l = null !== (r = t("ajaxUrl")) && void 0 !== r ? r : o("ajax_url"),
                        d = new FormData;
                    d.append("tracksNonce", c), d.append("action", "platform_tracks"), d.append("tracksEventName", e), d.append("tracksEventProp", JSON.stringify(s)), d.append("isLegacy", JSON.stringify(n)), fetch(l, {
                        method: "post",
                        body: d
                    })
                }("wcpay_proceed_to_checkout_button_click", {
                    woopay_direct_checkout: Boolean(t("isWooPayDirectCheckoutEnabled"))
                })
            };
        window.addEventListener("load", (() => {
            Object.values(v.redirectElements).forEach((e => {
                const t = document.querySelector(e);
                t && t.addEventListener("click", f)
            })), (() => {
                const e = document.querySelector(".cart-collaterals");
                e && new MutationObserver((() => {
                    const e = document.querySelector(v.redirectElements.CLASSIC_CART_PROCEED_BUTTON);
                    e && e.addEventListener("click", f)
                })).observe(e, {
                    childList: !0,
                    subtree: !0
                })
            })()
        }))
    })()
})();