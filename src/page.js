import React from 'react'
import getConfig from 'next/config'
import Router from 'next/router'

const isServer = typeof window === 'undefined'
const isClient = !isServer

const page = path => Controller => {
  class ControllerComponent extends React.Component {
    static path = path
    static displayName = `Controller(${Controller.name || 'Component'})`
    static async getInitialProps({ pathname, query, asPath, req, res }) {
      let { publicRuntimeConfig, serverRuntimeConfig } = getConfig()
      let context = {
        publicRuntimeConfig,
        serverRuntimeConfig,
        location: {
          pathname,
          query,
          raw: asPath
        },
        isServer,
        isClient,
        req,
        res
      }

      let controller = new Controller(context)
      controller.context = controller.context || context

      let SSR = true
      // check whether need SSR or not
      if (isServer) {
        if (typeof controller.SSR === 'function') {
          SSR = await controller.SSR()
        } else if (controller.SSR != null) {
          SSR = controller.SSR
        }
        if (SSR === false) {
          return {
            prepared: false
          }
        }
      }

      let prepared = await controller.$init()

      if (prepared === false) {
        return { prepared }
      }

      let preloadState = controller.store.getState()
      return {
        prepared,
        preloadState
      }
    }

    constructor(props) {
      super(props)
      let context = {
        publicRuntimeConfig: getConfig().publicRuntimeConfig,
        isServer,
        isClient
      }
      this.state = {
        prepared: this.props.prepared
      }
      this.controller = new Controller(context)
      this.controller.context = context
      this.controller.$init(this.props.preloadState)
    }

    attach() {
      let { store } = this.controller
      // handle refresh
      this.unsubscribe = store.subscribe(() => this.setState({ prepared: true }))

      // handle route event
      Router.onRouteChangeStart = (...args) => {
        if (controller.onRouteChangeStart) {
          return controller.onRouteChangeStart(...args)
        }
      }
      Router.onRouteChangeComplete = (...args) => {
        if (controller.onRouteChangeComplete) {
          return controller.onRouteChangeComplete(...args)
        }
      }
      Router.onRouteChangeError = (...args) => {
        if (controller.onRouteChangeError) {
          return controller.onRouteChangeError(...args)
        }
      }
      Router.onBeforeHistoryChange = (...args) => {
        if (controller.onBeforeHistoryChange) {
          return controller.onBeforeHistoryChange(...args)
        }
      }
    }

    detach() {
      this.unsubscribe()
      this.unsubscribe = null
      Router.onRouteChangeStart = null
      Router.onRouteChangeComplete = null
      Router.onRouteChangeError = null
      Router.onBeforeHistoryChange = null
    }

    componentDidMount() {
      this.attach()
      if (this.controller.onMount) {
        this.controller.onMount()
      }
    }

    componentWillUnmount() {
      this.detach()
      if (this.controller.onUnmount) {
        this.controller.onUnmount()
      }
      this.controller.$destroy()
    }

    render() {
      if (this.state.prepared) {
        return this.controller.render()
      }
      let { Loading } = this.controller
      if (Loading) {
        return <Loading />
      }
      return null
    }
  }

  return ControllerComponent
}

export default page
