import React from 'react'
import { Controller } from '../../../'

class Index extends Controller {
	initialState = {
    ...this.initialState,
		count: 0
	}
	reducer = {
		incre: state => (state.count += 1),
		decre: state => (state.count -= 1)
	}
  View = View

	onIncre = (event) => {
    let value = event.target.value
		this.actions.incre(value)
	}
	onDecre = () => {
		this.actions.decre()
	}
}

function View({ state, controller: ctrl }) {
	return (
		<Layout>
			<h1>Counter</h1>
			<button onClick={ctrl.onIncre}>+1</button>
			<span>{state.count}</span>
			<button onClick={ctrl.onDecre}>-1</button>
      <Controller.Consumer>
        {ctrl => {
          ctrl.state.theme 
        }}
      </Controller.Consumer>
		</Layout>
	)
}

export default Index.page('/')
