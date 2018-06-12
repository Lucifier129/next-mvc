import 'babel-polyfill'
import React from 'react'
import { Controller, page } from 'next-mvc'

@page
export default class Index extends Controller {
	SSR = true

	API = {
		next: 'https://api.github.com/repos/zeit/next.js'
	}

	// if SSR = false, and Loading is got, show loading instead of empty
	Loading = () => 'loading...'

	// initial state
	initialState = {
		count: 0,
		stars: 0
	}

	// reducer
	reducer = {
		stars: (state, stars) => (state.stars = stars),
		count: (state, n = 1) => (state.count += n)
	}

	// support async/await
	async onCreate() {
		let data = await this.get('next', null, { credentials: '' })
		this.actions.stars(data.stargazers_count)
	}

	onIncre = () => {
		this.actions.count(+1)
	}

	onDecre = () => {
		this.actions.count(-1)
	}

	render() {
		return (
			<React.Fragment>
				<h1>Stars: {this.state.stars}</h1>
				<button onClick={this.onIncre}>+1</button>
				<span>{this.state.count}</span>
				<button onClick={this.onDecre}>-1</button>
			</React.Fragment>
		)
	}
}
