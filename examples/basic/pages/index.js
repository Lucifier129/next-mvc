import React from 'react'
import { Ctrl } from 'next-mvc'

class Index extends Ctrl {
  initialState = {
    count: 0
  }
  reducer = {
    incre: state => (state.count += 1),
    decre: state => (state.count -= 1)
  }
  View = View

  onIncre = () => {
    this.actions.incre(value)
  }

  onDecre = () => {
    this.actions.decre()
  }
}

function View({ state, ctrl }) {
  return (
    <React.Fragment>
      <h1>Counter</h1>
      <button onClick={ctrl.onIncre}>+1</button>
      <span>{state.count}</span>
      <button onClick={ctrl.onDecre}>-1</button>
    </React.Fragment>
  )
}

export default Index.page('/')
