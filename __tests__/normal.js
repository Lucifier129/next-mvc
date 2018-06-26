const puppeteer = require('puppeteer')
const next = require('next')
const http = require('http')
const path = require('path')
const { parse } = require('url')
const fetch = require('isomorphic-fetch')

const port = 3000
const baseurl = `http://localhost:${port}`

let server, browser

beforeAll(async () => {
	console.log('start')
	const app = next({
		dev: true,
		dir: path.join(__dirname, '../examples/basic')
	})
	console.log('prepare')
	await app.prepare()
	console.log('prepared')
	server = http.createServer((req, res) => {
		let parsedUrl = parse(req.url, true)
		handle(req, res, parsedUrl)
	})
	await new Promise((resolve, reject) => {
		server.listen(port, error => {
			error ? reject(error) : resolve(server)
		})
	})
	browser = await puppeteer.launch()
})

afterAll(() => server.close())

test('it should support SSR correctly', async () => {
  let response = await fetch(`${baseurl}/static`)
  let html = await response.text()
  expect(html.includes('It is static page')).toBe(true)
})
