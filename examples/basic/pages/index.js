import 'babel-polyfill'
import React from 'react'
import { Ctrl } from 'next-mvc'

class Index extends Ctrl {
  SSR = false

  Loading = () => 'loading...'

  initialState = {
    count: 0,
    stars: 0
  }

  reducer = {
    stars: (state, stars) => (state.stars = stars),
    count: (state, n = 1) => (state.count += n)
  }

  View = View

  API = {
    next: 'https://api.github.com/repos/zeit/next.js'
  }

  async onCreate() {
    let data = await this.get('next', null, {
      credentials: ''
    })
    this.actions.stars(data.stargazers_count)
  }

  onIncre = () => {
    this.actions.count(+1)
  }

  onDecre = () => {
    this.actions.count(-1)
  }
}

function View({ state, ctrl }) {
  return (
    <React.Fragment>
      <h1>Stars: {state.stars}</h1>
      <button onClick={ctrl.onIncre}>+1</button>
      <span>{state.count}</span>
      <button onClick={ctrl.onDecre}>-1</button>
    </React.Fragment>
  )
}

export default Index.page('/')
