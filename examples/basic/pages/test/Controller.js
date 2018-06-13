import React from 'react'
import { Controller, page } from 'next-mvc'
import View from './View'
import * as Model from './Model'

export default class extends Controller {
	Model = Model
	View = View

	handleIncre = () => {
		this.actions.count(+1)
	}
	handleDecre = () => {
		this.actions.count(-1)
	}
}
