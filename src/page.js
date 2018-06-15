import React from 'react'
import { createStore, applyMiddleware, compose } from 'redux'
import immer from 'immer'
import qs from 'query-string'
import Router from 'next/router'
import getConfig from 'next/config'
import fetch from 'isomorphic-fetch'
import cookie from 'isomorphic-cookie'
import { format } from 'url'
import * as util from './util'

const isServer = typeof window === 'undefined'
const isClient = !isServer

export default class Page extends React.Component {
	static getInitialProps({ pathname, query, asPath, req, res }) {
		let { appPrefix = '' } = getConfig().publicRuntimeConfig
		asPath = appPrefix + asPath

		let Page = this
		let page = new Page({ pathname, query, asPath, req, res })
		let handleInitialState = initialState => {
			if (util.isThenable(initialState)) {
				return initialState.then(handleInitialState)
			}

			// handle redirect
			if (res && res.finished) {
				return {}
			}

			return {
				initialState: {
					...page.state,
					...initialState
				},
				pathname,
				query,
				asPath
			}
		}

		// handle get initial state
		if (page.getInitialState) {
			return handleInitialState(page.getInitialState())
		}

		return handleInitialState()
	}

	constructor(props) {
		super(props)
		this.apiPrefix = ''
		this.appPrefix = ''
		this.reduxDevtools = true
		this.immer = true
		this.API = null
		this.View = null
		this.Loading = null
		this._actions = null
		this.state = {
			...props.initialState
		}
		this.store = isClient ? this.createStore() : null
	}

	render() {
		let { View, Loading } = this
		if (!View) {
			if (Loading) {
				return <Loading state={this.state} />
			}
			return null
		}
		return <View state={this.state} page={this} />
	}

	get isServer() {
		return isServer
	}

	get isClient() {
		return isClient
	}

	get actions() {
		if (this._actions) {
			return this._actions
		}

		this._actions = {}

		if (this.reducer != null && typeof this.reducer === 'object') {
			Object.keys(this.reducer).forEach(type => {
				this._actions[type] = payload => this.store.dispatch({ type, payload })
			})
		}

		return this._actions
	}

	createStore(enhancer) {
		let finalReducer = (_, action) => {
			let reducer = this.reducer
			let nextState = this.state
			if (typeof reducer === 'object') {
				let handler = reducer[action.type]
				if (typeof handler === 'function') {
					if (this.immer) {
						nextState = immer(nextState, draft => {
							handler(draft, action.payload)
						})
					} else {
						nextState = handler(nextState, action.payload)
					}
				}
			} else if (typeof reducer === 'function') {
				nextState = reducer(nextState, action)
			}
			return nextState
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
			if (!enhancer) {
				enhancer = window.__REDUX_DEVTOOLS_EXTENSION__(options)
			} else {
				const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(
					options
				)
				enhancer = composeEnhancers(enhancer)
			}
		}

		let store = createStore(finalReducer, this.state, enhancer)
		store.unsubscribe = store.subscribe(() => this.setState(store.getState()))
		return store
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

	// router properties and methods
	get router() {
		return Router
	}

	set router(_) {
		throw new Error('Property "router" is readonly')
	}

	// for api
	prependApiPrefix(path) {
		let apiPrefix = this.apiPrefix || this.getConfig('apiPrefix') || ''
		return apiPrefix + path
	}

	// for app page transition
	prependAppPrefix(path) {
		let appPrefix = this.appPrefix || this.getConfig('appPrefix') || ''
		return appPrefix + path
	}

	// redirect or page transition
	go(url, replace = false, raw = false) {
		let { props } = this

		// handle url object
		if (typeof url === 'object') {
			url = format(url)
		}

		if (url === '') {
			url = '/'
		}

		let originalUrl = url

		if (!util.isAbsoluteUrl(url) && !raw) {
			url = this.prependAppPrefix(url)
		}

		// handle server side redirect
		if (this.isServer) {
			// https://github.com/zeit/next.js/wiki/Redirecting-in-%60getInitialProps%60
			props.res.writeHead(302, { Location: url })
			props.res.end()
			props.res.finished = true
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

		// handle router
		if (replace) {
			Router.replace(originalUrl, url)
		} else {
			Router.push(originalUrl, url)
		}
	}

	// get config
	getConfig(name) {
		let { publicRuntimeConfig, serverRuntimeConfig } = getConfig()
		let config = {
			...publicRuntimeConfig,
			...serverRuntimeConfig
		}
		return config[name]
	}

	/**
	 * fetch, https://github.github.io/fetch
	 * options.json === false, it should not convert response to json automatically
	 * options.timeout:number request timeout
	 * options.raw === true, it should not add prefix to api
	 */
	fetch(api, options = {}) {
		let { props, API } = this

		/**
		 * API shortcut
		 */
		if (API && Object.prototype.hasOwnProperty.call(API, api)) {
			api = API[api]
		}

		// add prefix to api
		if (!options.raw) {
			api = this.prependApiPrefix(api)
		}

		let finalOptions = {
			method: 'GET',
			credentials: 'include',
			...options,
			headers: { 'Content-Type': 'application/json', ...options.headers }
		}

		/**
		 * add cookie from props.req in server side
		 */
		if (this.isServer && finalOptions.credentials === 'include') {
			finalOptions.headers['Cookie'] = props.req.headers.cookie || ''
		}

		let fetchData = fetch(api, finalOptions)

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
	get(api, params, options) {
		let { API } = this
		/**
		 * API shortcut
		 */
		if (API && Object.prototype.hasOwnProperty.call(API, api)) {
			api = API[api]
		}

		// handle api params
		if (params) {
			let delimiter = api.indexOf('?') !== -1 ? '&' : '?'
			api += delimiter + qs.stringify(params)
		}

		return this.fetch(api, {
			...options,
			method: 'GET'
		})
	}
	/**
	 *
	 * post method
	 */
	post(api, data, options) {
		return this.fetch(api, {
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
		return cookie.get(key, this.props.req)
	}

	setCookie(key, value, options) {
		//  Value can be a Number which will be interpreted as days from time of creation or a Date
		if (options && typeof options.expires === 'number') {
			options = {
				...options,
				expires: new Date(new Date() * 1 + options.expires * 864e5)
			}
		}
		cookie.set(key, value, options, this.props.res)
	}

	removeCookie(key, options) {
		cookie.remove(key, options, this.props.res)
	}
}
