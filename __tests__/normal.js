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
	browser = await puppeteer.launch()
})

afterAll(async () => {
	await browser.close()
})

test('it should support SSR correctly', async () => {
	let response = await fetch(`${baseurl}/static_page`)
	let html = await response.text()
	expect(html.includes('It is static page')).toBe(true)
})

test('it')