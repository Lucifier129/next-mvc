import React from 'react'
import { createStore, applyMiddleware, compose } from 'redux'
import immer from 'immer'
import qs from 'query-string'
import Router from 'next/router'
import fetch from 'isomorphic-fetch'
import cookie from 'isomorphic-cookie'
import { format } from 'url'
import * as util from './util'
import page from './page'

const { Provider, Consumer } = React.createContext()

export default class Controller {
	static Provider = Provider
	static Consumer = Consumer
	static page(...args) {
		return page(...args)(this)
	}

	constructor(context) {
		this.context = context
		this.urlPrefix = ''
		this.reduxDevtools = true
		this.immer = true
		this.SSR = true
		this.API = null
		this.Model = null
		this.View = null
		this.store = null
		this.actions = {}
		this.reducer = {}
		this.enhancer = undefined
		this.initialState = null
	}

	get isServer() {
		return this.context.isServer
	}

	get isClient() {
		return this.context.isClient
	}

	get location() {
		if (this.isServer) {
			return this.context.location
		} else if (this.isClient) {
			return {
				pathname: Router.pathname,
				query: Router.query,
				raw: Router.asPath
			}
		}
	}

	set location(_) {
		throw new Error('Property "location" is readonly')
	}

	createStore(preloadState) {
		let { Model, reducer, initialState, enhancer } = this

		// if Model is set, { initialState, reducer, enhancer } = Model
		if (Model) {
			initialState = Model.initialState
			reducer = Model.reducer
			enhancer = Model.enhancer
		}

		// merge state
		let finalInitialState = {
			...initialState,
			...preloadState
		}

		// handle object type
		if (typeof reducer === 'object') {
			const handlers = reducer
			reducer = (state, action) => {
				let handler = handlers[action.type]
				if (typeof handler === 'function') {
					if (this.immer) {
						return immer(state, draft => {
							handler(draft, action.payload)
						})
					} else {
						return handler(state, action.payload)
					}
				}
				return state
			}
			Object.keys(handlers).forEach(type => {
				this.actions[type] = payload => this.store.dispatch({ type, payload })
			})
		}

		// handle redux-devtools
		if (
			this.isClient &&
			this.reduxDevtools &&
			window.__REDUX_DEVTOOLS_EXTENSION__
		) {
			const options = {
				name: window.location.pathname + window.location.search
			}
			const reduxDevtoolsEnhancer = window.__REDUX_DEVTOOLS_EXTENSION__(options)
			if (!enhancer) {
				enhancer = reduxDevtoolsEnhancer
			} else {
				const composeEnhancers =
					window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
				enhancer = composeEnhancers(
					applyMiddleware(reduxDevtoolsEnhancer, enhancer)
				)
			}
		}

		this.store = createStore(reducer, finalInitialState, enhancer)
		return this.store
	}

	/**
	 * dispatch(type, payload)
	 * or
	 * dispatch({ type, payload })
	 */
	dispatch(type, payload) {
		let action = { type, payload }
		if (type != null && typeof type === 'object' && payload == null) {
			action = type
		}
		return this.store.dispatch(action)
	}

	get state() {
		return this.store.getState()
	}

	set state(_) {
		throw new Error('Property "state" is readonly')
	}

	// router properties and methods
	get router() {
		return Router
	}

	set router(_) {
		throw new Error('Property "router" is readonly')
	}

	// redirect or page transition
	go(url, replace = false) {
		let { context } = this

		// handle url object
		if (typeof url !== 'object') {
			url = format(url)
		}

		context.redirected = true

		// handle server side redirect
		if (this.isServer) {
			// https://github.com/zeit/next.js/wiki/Redirecting-in-%60getInitialProps%60
			context.res.writeHead(302, { Location: url })
			context.res.end()
			context.res.finished = true
			return
		}

		// handle absolute url
		if (util.isAbsoluteUrl(url)) {
			if (replace) {
				window.location.replace(url)
			} else {
				window.location.href = url
			}
			return
		}

		// handle pushState
		if (replace) {
			Router.replace(url)
		} else {
			Router.push(url)
		}
	}

	// reload without refresh page
	reload() {
		this.go(this.location.raw, true)
	}

	// get config
	getConfig(name) {
		let config = {
			...this.context.publicRuntimeConfig,
			...this.context.serverRuntimeConfig
		}
		return config[name]
	}

	// fetch and relative utilities
	prependUrlPrefix(url) {
		let urlPrefix = this.urlPrefix || this.getConfig('urlPrefix') || ''
		return urlPrefix + url
	}
	/**
	 * fetch, https://github.github.io/fetch
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
			method: 'GET',
			credentials: 'include',
			...options,
			headers: { 'Content-Type': 'application/json', ...options.headers }
		}

		/**
		 * add cookie from context.req in server side
		 */
		if (this.isServer && finalOptions.credentials === 'include') {
			finalOptions.headers['Cookie'] = context.req.headers.cookie || ''
		}

		let fetchData = fetch(url, finalOptions)

		/**
		 * parse json automatically
		 */
		if (options.json !== false) {
			fetchData = fetchData.then(util.toJSON)
		}

		/**
		 * handle timeout
		 */
		if (typeof options.timeout === 'number') {
			fetchData = timeoutReject(fetchData, options.timeout)
		}

		return fetchData
	}

	/**
	 *
	 * get method
	 */
	get(url, params, options) {
		let { API } = this
		/**
		 * API shortcut
		 */
		if (API && Object.prototype.hasOwnProperty.call(API, url)) {
			url = API[url]
		}

		// handle url params
		if (params) {
			let delimiter = url.indexOf('?') !== -1 ? '&' : '?'
			url += delimiter + qs.stringify(params)
		}

		return this.fetch(url, {
			...options,
			method: 'GET'
		})
	}
	/**
	 *
	 * post method
	 */
	post(url, data, options) {
		return this.fetch(url, {
			...options,
			method: 'POST',
			body: typeof data === 'object' ? JSON.stringify(data) : String(data)
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
		return cookie.get(key, this.context.req)
	}

	setCookie(key, value, options) {
		//  Value can be a Number which will be interpreted as days from time of creation or a Date
		if (options && typeof options.expires === 'number') {
			options = {
				...options,
				expires: new Date(new Date() * 1 + options.expires * 864e5)
			}
		}
		cookie.set(key, value, options, this.context.res)
	}

	removeCookie(key, options) {
		cookie.remove(key, options, this.context.res)
	}
}
