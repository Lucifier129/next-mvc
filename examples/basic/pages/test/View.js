import React from 'react'

export default function View({ state, ctrl }) {
	return (
		<React.Fragment>
			<h1>Stars: {state.count}</h1>
			<button onClick={ctrl.handleIncre}>+1</button>
			<span>{state.count}</span>
			<button onClick={ctrl.handleDecre}>-1</button>
		</React.Fragment>
	)
}
