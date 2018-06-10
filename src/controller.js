import React from "react"
import { createStore } from "redux"
import immer from "immer"
import qs from "query-string"
import Router from "next/router"
import fetch from "isomorphic-fetch"
import cookie from "isomorphic-cookie"
import { format } from "url"

export default class Controller {
  constructor(context) {
    this.context = context
    this.manager = null
    this.API = null
    this.Model = null
    this.View = null
    this.store = null
    this.actions = null
  }

  createStore(reducer, preloadState, enhancer) {
    return createStore(reducer, preloadState, enhancer)
  }

  dispatch(...args) {
    return this.store.dispatch(...args)
  }

  async $init() {
    let { context, SSR } = this

    // check whether need SSR or not
    if (context.isServer) {
      if (typeof this.SSR === "function") {
        SSR = await this.SSR()
      }
      if (SSR === false) {
        return false
      }
    }

    let { reducer, reducers, state, enhancer } = this.Model || {}

    if (reducer == null && reducers != null && typeof reducers === "object") {
      reducer = (state, action) => {
        let handler = reducers[action.type]
        if (typeof handler === "function") {
          return immer(state, draft => {
            handler(draft, action.payload)
          })
        }
        return state
      }
      this.actions = Object.keys(reducers).reduce((actions, type) => {
        actions[key] = payload => this.store.dispatch({ type, payload })
        return actions
      }, {})
    }

    this.store = this.createStore(reducer, state, enhancer)
  }

  $destroy() {}

  // router properties and methods
  get route() {
    return Router.route
  }
  set route(_) {
    throw new Error('Property "route" is readonly')
  }
  get pathname() {
    return Router.pathname
  }
  set pathname(_) {
    throw new Error('Property "pathname" is readonly')
  }
  get query() {
    return Router.query
  }
  set query(_) {
    throw new Error('Property "query" is readonly')
  }
  get path() {
    return Router.asPath
  }
  set path(_) {
    throw new Error('Property "path" is readonly')
  }

  go(url, replace = false) {
    let { context } = this

    if (typeof url !== "object") {
      url = format(url)
    }

    if (context.isServer) {
      context.res.writeHead(302, { Location: url })
      context.res.end()
      return
    }

    if (replace) {
      Router.replace(url)
    } else {
      Router.push(url)
    }
  }

  // fetch and relative utilities
  prependUrlPrefix(url) {
    let { urlPrefix = "" } = this.context
    return urlPrefix + url
  }
  /**
   * 封装 fetch, https://github.github.io/fetch
   * options.json === false, it should not convert response to json automatically
   * options.timeout:number request timeout
   * options.raw === true, it should not add prefix to url
   */
  fetch(url, options = {}) {
    let { context, API } = this

    /**
     * API shortcut
     */
    if (API && Object.prototype.hasOwnProperty.call(API, url)) {
      url = API[url]
    }

    // add prefix to url
    if (!options.raw) {
      url = this.prependUrlPrefix(url)
    }

    let finalOptions = {
      method: "GET",
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers }
    }
    /**
     * add cookie from context.req in server side
     */
    if (context.isServer && finalOptions.credentials === "include") {
      finalOptions.headers["Cookie"] = context.req.headers.cookie || ""
    }

    let fetchData = fetch(url, finalOptions)

    /**
     * parse json automatically
     */
    if (options.json !== false) {
      fetchData = fetchData.then(response => response.json())
    }

    /**
     * handle timeout
     */
    if (typeof options.timeout === "number") {
      let timeoutReject = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("request timeout")), options.timeout)
      })
      fetchData = Promise.race(timeoutReject, fetchData)
    }

    return fetchData
  }
  /**
   *
   * 封装 get 请求，方便使用
   */
  get(url, params, options) {
    let { API } = this
    /**
     * API shortcut
     */
    if (API && Object.prototype.hasOwnProperty.call(API, url)) {
      url = API[url]
    }
    if (params) {
      let delimiter = url.indexOf("?") !== -1 ? "&" : "?"
      url += delimiter + qs.stringify(params)
    }

    return this.fetch(url, {
      ...options,
      method: "GET"
    })
  }
  /**
   *
   * 封装 post 请求，方便使用
   */
  post(url, data, options) {
    return this.fetch(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data)
    })
  }

  // cookie utilities
  cookie(key, value, options) {
    if (value == null) {
      return this.getCookie(key)
    }
    this.setCookie(key, value, options)
  }
  getCookie(key) {
    let { context } = this
    return cookie.get(key, context.req)
  }
  setCookie(key, value, options) {
    let { context } = this

    if (options && options.expires) {
      let isDateInstance = options.expires instanceof Date
      if (!isDateInstance) {
        throw new Error(
          `cookie expires must be instance of Date instead of ${
            options.expires
          }`
        )
      }
    }

    cookie.set(key, value, options, context.res)
  }
  removeCookie(key, options) {
    let { context } = this
    cookie.remove(key, options, context.res)
  }
}
