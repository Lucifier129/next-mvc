import 'babel-polyfill'
import React from 'react'
import { Page, Link } from 'next-mvc'

export default class IndexPage extends Page {
	API = {
		next: 'https://api.github.com/repos/zeit/next.js',
		config: 'https://sec-m.ctrip.com/restapi/soa2/12446/QConfig.json'
	}

	// // reducer
	reducer = {
		stars: (state, stars) => (state.stars = stars),
		count: (state, n = 1) => (state.count += n)
	}

	// // support async/await
	async getInitialState() {
		let count = Number(this.cookie('test'))
		if (isNaN(count)) {
			count = 0
			this.cookie('test', count)
		}

		// this.go('/test')

		let postData = {
			NetWorkStatus: 1,
			PlatformId: 1,
			ProductId: 66865,
			SaleCityId: 2,
			DepartureCityId: 2,
			HeadTagList: [{ key: '170215_vag_shopa', Value: 'B' }],
			Channel: 3,
			KeyList: ['six_security'],
			Version: '71300',
			ChannelCode: 0,
			head: {
				cid: '09031084110010751888',
				ctok: '',
				cver: '1.0',
				lang: '01',
				sid: '8888',
				syscode: '09',
				auth: null,
				extension: [{ name: 'protocal', value: 'http' }]
			},
			contentType: 'json'
		}
		// let data = await this.post('config', postData)

		return {
			// data,
			count: count,
			stars: 1000
		}
	}

	hanldeIncre = () => {
		this.actions.count(+1)
	}

	handleDecre = () => {
		this.actions.count(-1)
	}

	goToTest = () => {
		this.go('/test')
	}

	componentDidMount() {
		console.log('didmount')
		this.store.subscribe(() => {
			this.cookie('test', this.store.getState().count)
		})
	}

	render() {
		return (
			<React.Fragment>
				<h1>Stars: {this.state.stars}</h1>
				<button onClick={this.hanldeIncre}>+1</button>
				<span>{this.state.count}</span>
				<button onClick={this.handleDecre}>-1</button>
				<div>
					<Link href="/test">test</Link>
				</div>
				<div onClick={this.goToTest}>go to test page</div>
			</React.Fragment>
		)
	}
}
