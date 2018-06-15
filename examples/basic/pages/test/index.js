import 'babel-polyfill'
import React from 'react'
import { Page } from 'next-mvc'
import View from './View'
import { initialState, reducer } from './Model'

export default class TestPage extends Page {
	// state = initialState
	reducer = reducer
	View = View

	async getInitialState() {
		
		return {
			...initialState,
			count: 1000
		}
	}

	componentDidMount() {

	}

	handleIncre = () => {
		this.actions.count(+1)
	}
	handleDecre = () => {
		this.actions.count(-1)
	}

	goToHome = () => {
		this.go('/')
	}
}
