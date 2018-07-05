import 'babel-polyfill'
import React from 'react'
import { Page } from 'next-mvc'

export default class IndexPage extends Page {
	state = {
		count: 0
	}

	reducer = {
		count: (state, n = 1) => (state.count += n)
	}

	hanldeIncre = () => {
		this.actions.count(+1)
	}

	handleDecre = () => {
		this.actions.count(-1)
	}

	render() {
		return (
			<React.Fragment>
				<button onClick={this.hanldeIncre} id="incre">
					+1
				</button>
				<span id="count">{this.state.count}</span>
				<button onClick={this.handleDecre} id="decre">
					-1
				</button>
			</React.Fragment>
		)
	}
}
