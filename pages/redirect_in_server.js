import "babel-polyfill"
import React from 'react'
import { Page } from '../src'

export default class extends Page {
	async getInitialState() {
    this.redirect('/reducer')
  }
}
