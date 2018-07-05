import "babel-polyfill"
import React from 'react'
import { Page } from '../src'

export default class extends Page {
  componentDidMount() {
    this.redirect('/reducer')
  }
  render() {
    return null
  }
}
