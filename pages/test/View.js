import React from 'react'
import {Link} from '../../src'

export default function View({ state, page }) {
	return (
		<React.Fragment>
			<h1>Stars: {state.count}</h1>
			<button onClick={page.handleIncre}>+1</button>
			<span>{state.count}</span>
			<button onClick={page.handleDecre}>-1</button>
			<div>
				<Link href="/">首页</Link>
			</div>
			<div onClick={page.goToHome}>go to home page</div>
		</React.Fragment>
	)
}
