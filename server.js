const next = require('next')
const http = require('http')
const path = require('path')
const { parse } = require('url')
const fetch = require('isomorphic-fetch')

module.exports = main

async function main({ port = 3000 }) {
	const app = next({ dev: true })
	const server = http.createServer((req, res) => {
		if (/get/i.test(req.method) && req.url === '/api/data') {
			res.end(JSON.stringify({ data: { type: 'get', text: 'from server' } }))
			return
		}

		if (/post/i.test(req.method) && req.url === '/api/data') {
			res.end(JSON.stringify({ data: { type: 'post', text: 'from server' } }))
			return
		}

		let parsedUrl = parse(req.url, true)
		handle(req, res, parsedUrl)
	})
	const handle = app.getRequestHandler()
	await app.prepare()
	await new Promise((resolve, reject) => {
		server.listen(3000, error => {
			error ? reject(error) : resolve({ app, server })
		})
	})
}

if (!module.parent) main({ port: 3000 })
