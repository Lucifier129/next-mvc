import "babel-polyfill"
import React from 'react'
import { Page } from '../src'

export default class extends Page {
	async getInitialState() {
    let randomCookie = Math.random().toString(36)
    this.cookie('test', randomCookie)
		return { value: randomCookie }
  }
  componentDidMount() {
    let randomCookie = Math.random().toString(36)
    this.cookie('test', randomCookie)
  }
	render() {
		return <div id="cookie">{this.state.value}</div>
	}
}
