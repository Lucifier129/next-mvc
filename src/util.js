export function timeoutReject(promise, time = 0) {
	let timeoutReject = new Promise((_, reject) => {
		setTimeout(() => reject(new Error(`Timeout Error:${time}ms`)), time)
	})
	return Promise.race([promise, timeoutReject])
}

export function isAbsoluteUrl(url) {
	return url.indexOf('http') === 0 || url.indexOf('//') === 0
}

export function isThenable(obj) {
	return !!(obj && typeof obj.then === 'function')
}

export function isObject(obj) {
	return obj != null && typeof obj === 'object'
}

export function isFunction(obj) {
	return typeof obj === 'function'
}

/**
 * 
 * check whether obj is the response of fetch API in a loose way
 */
export function isResponse(obj) {
	if (!obj) return false
	if (typeof obj.json !== 'function') return false
	if (typeof obj.text !== 'function') return false
	return true
}

export function checkComponent(Component) {
	if (Component.prototype.componentWillMount) {
		throw new Error('Deprecated API "componentWillMount" is unsupported')
	}
	if (Component.prototype.componentWillUpdate) {
		throw new Error('Deprecated API "componentWillUpdate" is unsupported')
	}
	if (Component.prototype.componentWillReceiveProps) {
		throw new Error('Deprecated API "componentWillReceiveProps" is unsupported')
	}
}

export const isPlainObject = obj => {
	if (typeof obj !== 'object' || obj === null) return false

	let proto = obj
	while (Object.getPrototypeOf(proto) !== null) {
		proto = Object.getPrototypeOf(proto)
	}

	return Object.getPrototypeOf(obj) === proto
}
