export function toJSON(response) {
	// 如果 response 状态异常，抛出错误
	if (!response.ok || response.status !== 200) {
		return Promise.reject(new Error(response.statusText))
	}
	return response.json()
}

export function timeoutReject(promise, time = 0) {
	let timeoutReject = new Promise((_, reject) => {
		setTimeout(() => reject(new Error(`Timeout Error:${time}ms`)), time)
	})
	return Promise.race([promise, timeoutReject])
}

export function isAbsoluteUrl(url) {
	return url.indexOf('http') === 0 || url.indexOf('//') === 0
}
