import "babel-polyfill"
import React from 'react'
import { Page } from '../src'

export default class extends Page {
	async getInitialState() {
		let data = await this.get(`http://localhost:3000/api/data`)
		return { data }
  }
  async componentDidMount() {
    let data = await this.post('http://localhost:3000/api/data')
    this.setState({ data })
  }
	render() {
		return <div id="content">{JSON.stringify(this.state.data)}</div>
	}
}
