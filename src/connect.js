import React from 'react'
import Controller from './controller'

const getCtrl = ctrl => ({ ctrl })
const connect = (mapCtrlToProps = getCtrl) => Component => {
	return function ControllerConnector(props) {
		return (
			<Controller.Consumer>
				{ctrl => {
					let data = mapCtrlToProps(ctrl, props)
					return <Component {...props} {...data} />
				}}
			</Controller.Consumer>
		)
	}
}

export default connect
