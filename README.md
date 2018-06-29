# next-mvc

`next.js` 是一款基于 `react` 的 SSR 框架。通过拓展组件的静态方法 `getInitialProps` 实现异步获取数据的功能。

然而，`getInitialProps(context)` 在使用上还是太底层，我们需要手动判断 `context.req` 是否存在，以区分代码运行在 `server side` 还是 `client side`。

`next-mvc` 通过一层封装，将 `getInitialProps` 的静态方法，变成 `getInitialState` 的实例方法，并提供如 `fetch`, `cookie`, `goto/redirect` 等同构方法，以及整合 `redux` 作为状态管理工具。提供了 `high-level` 的 api，补充了专注 `view` 层的 `next.js` 缺失的 `controller` 和 `model` 层。

## Installation

```shell
npm install --save next-mvc next react react-dom
```

# Table of Contents 👇

- [Usage](#usage)
- [API](#API)
- [State Management](#state-management)
- [Page Properties](#page-properties)
- [Link](#link)

## Usage

示例项目 [next-mvc-cnode](https://github.com/Lucifier129/next-mvc-cnode)

```jsx
import { Page } from 'next-mvc'
import React from 'react'

export default class MyPage extends Page {
	// do async logic in getInitialState
	async getInitialState() {
		const url = 'https://api.github.com/repos/zeit/next.js'
		const json = await this.fetch(url)
		return { stars: json.stargazers_count }
	}
	render() {
		return (
			<div>
				<p>Next.js has {this.state.stars} ⭐️</p>
			</div>
		)
	}
}
```

## API

### Page Component

`Page` 类是继承 `React.Component` 的一个子类，它拥有跟 `React.Component` 一样的生命周期和方法。同时拓展了一些便利的同构方法，以及整合了 redux 等库。

### page.getInitialState(context)

page.getInitialState 方法是 SSR 的关键，它接受的参数跟 next.js 的 `getInitialProps` 一样，差别在于后者会出现在组件的 props 里，而 `getInitialState` 的返回值，会出现在组件的 state 里。

最好不要同时声明  this.state 和 `getInitialState` 方法，避免冲突。

### page.fetch(url:String, [options:Object])

fetch 方法用来跟服务端进行 http 或 https 通讯，它的用法和参数跟浏览器里自带的 fetch 函数一样。全局 fetch 函数的[使用文档](https://github.github.io/fetch/)

- page.fetch 默认为 headers 设置 Content-Type 为 application/json

- page.fetch 默认设置 credentials 为 include，即默认发送 cookie

- page.fetch 默认调用 response.json() 方法，返回的是 json/object 对象，可以通过配置 options.responseType 改变数据类型

- page.fetch 的 options 参数除了支持 native fetch 的 options 外，还有一下拓展参数

  - options.responseType，响应数据的类型，默认值为 json，可以配置为 text 或者 buffer。这个字段影响了 page.fetch 所返回的数据类型
  - options.response，是否要获取 response 对象，默认为 false。如果设置为 true，将忽略 responseType 选项，返回 response 对象，由开发者自行调用 response 里的方法。
  - options.timeout，超时时间，默认为 undefined，当设置为 number 类型时，如果请求没有在 timeout 时间内得到响应，将自动 reject 一个 timeout error。超时 reject 不会 abort 请求，内部用 `Promise.race` 忽略请求的结果

- page.API 属性存在时，page.fetch(url, options) 会有以下行为

  - 内部会对 url 进行转换 `url = page.API[url] || url`
  - 该特性可以将 url 简化为 this.fetch(api_name)

- 当全局配置 config.apiPrefix 存在，或者 page.apiPrefix 存在，且 url 为非绝对路径时，page.fetch(url, options) 会有以下行为

  - 内部会对 url 进行转换 `url = apiPrefix + url`
  - 当 options.raw === true 时，不做上述转换，直接使用 url

- page.API 和 apiPrefix 可以配合使用，先通过 page.API 获取到 url，再进行 apiPrefix + url 的补全

- 在服务端调用 page.fetch 时，默认附带 `req.headers.cookie` 的值到 request headers 里。设置 options.credentials 为 include 以外的值，可以取消此行为。

- 当 options.fetch 存在时，它会代替 global.fetch 去发送请求。如果有需要，你可以传递这个参数，接管 fetch 方法。

### page.get(url:String, [params:Object], [options:Object])

page.get 方法是基于 page.fetch 封装的方法，更简便地发送 get 请求。

url 参数的处理，跟 page.fetch 方法一致。

params 参数将在内部被 querystring.stringify ，拼接在 url 后面。

options 参数将作为 fetch 的 options 传递。

### page.post(url:String, [data:Object|FormData], [options:Object])

page.post 方法是基于 page.fetch 封装的方法，更简便地发送 post 请求。

url 参数的处理，跟 page.fetch 方法一致。

如果 data 是对象，将在内部被 JSON.stringify ，然后作为 request payload 发送给服务端

options 参数将作为 fetch 的 options 传递。

### page.goto(url:String|Object, [replace:Boolean], [raw:Boolean])

page.goto 方法用以跳转页面。

- 当 url 参数为 string 时，如果 url 不是绝对路径，且 raw 不为 true，则用 `page.appPrefix` 或 `config.appPrefix` 补全。最终的跳转地址为 `appPrefix + url`
- 当 url 参数为 object 时，将使用 [url](https://www.npmjs.com/package/url) 模块的 [format](https://www.npmjs.com/package/url#urlformaturlobj) 方法，序列化为字符串形式。
- 当 url 参数为绝对路径时，采用 `window.location.href` 或 `window.location.replace` 的形式跳转
- 当 url 参数不是绝对路径时，采用 `history.pushState` 或 `history.replaceState` 的形式跳转
- 当 replace 参数为 true 时，跳转模式为替换，history.back 无法回到当前页面。
- 当 raw 参数为 true 时，不对 url 进行 `appPrefix` 的补全处理。

### page.redirect(url:String, [raw:Boolean])

page.redirect 方法可实现重定向功能。是 `page.goto(url, true, raw)` 的一个封装。

在 page.getInitialState 内直接或间接调用 page.redirect 方法，会有一个额外作用。

- page.redirect 会 throw error 以中断你的代码
- 你的代码里不需要判断 redirected 状态来进行下一步

### page.getCookie(key:String)

page.getCookie 用以获取 cookie 里跟 key 参数对应的 value 值。

### page.setCookie(key:String, value:String, [options:Object])

page.setCookie 用以设置 cookie 里跟 key 参数对应的 value 值。第三个参数 options 为对象，可查看[使用文档](https://github.com/js-cookie/js-cookie#cookie-attributes)

### page.removeCookie(key:String, [options:Object])

page.removeCookie 用以删除 cookie 里跟 key 参数对应的 value 值。第三个参数 options 为对象，可查看[使用文档](https://github.com/js-cookie/js-cookie#cookie-attributes)

### page.cookie(key:String, [value:String], [options:Object])

page.cookie 方法是上述 `getCookie`、`setCookie` 方法的封装。

- 当只有一个 key 参数时，内部调用 `getCookie` 方法。

- 当有两个或两个以上的参数时，内部调用 `setCookie` 方法。

### page.back()

page.back 方法用以回退到上一个页面

### page.forward()

page.forward() 方法用以跳转到下一个页面

### page.getConfig(name:String)

page.getConfig 方法，可以获取 `{xxx}.config.js` 里配置的 `publicRuntimeConfig` 和 `serverRuntimeConfig` 里的值。

### page.dispatch(type:String, payload:Any)

page.dispatch 方法可以触发一个 redux store action，它接受两个参数，第一个为 action-type，第二个为 action-payload。

此外，你也可以使用 `page.dispatch({ type, payload })` 的方式触发 action

## State Management

`next-mvc` 采用 `redux` 作为状态管理机制，并用 [immer](https://www.npmjs.com/package/immer) 来优化 reducer 里操作 immutable-data 的方式。

一个经典的 `Counter` 计数器的实现，如下所示。

```jsx
// counter.js
import React from 'react'
import { Page } from 'next-mvc'

export default class Counter extends Page {
	getInitialState() {
		return {
			count: 0
		}
	}
	// reducer 是一个对象，其 key 将被当做 action type，其 value 则是 handler(state, action_payload) 函数
	reducer = {
		// 通过 immer，我们可以直接修改 state 对象，而不用担心修改了原来的引用对象
		changeCount: (state, n) => state + n
	}
	handleIncre = () => {
		// page 内部会自动 bindActionCreatros，可以直接使用 this.actions 拿到 changeCount 函数。
		this.actions.changeCount(+1)
	}
	handleDecre = () => {
		this.actions.changeCount(-1)
	}
	render() {
		return (
			<React.Fragment>
				<button onClick={this.handleIncre}>+1</button>
				{this.state.count}
				<button onClick={this.handleDecre}>-1</button>
			</React.Fragment>
		)
	}
}
```

## Page Properties

### page.props

page.props 是当前组件的 props 对象，包含 pathname, query, asPath 属性，是当前页面的参数。

### page.View

page 组件拥有默认的 render 方法，在内部会渲染 page.View 组件。

### page.isClient

page.isClient 是 boolean 值，判断当前是否在客户端。通常不需要使用到这个属性。

### page.isServer

page.isServer 是 boolean 值，判断当前是否在服务端。

### page.reducer

page.reducer 可以是一个普通的 reducer 函数，也可以是一个对象。

当 page.reducer 是对象时，它的 key 将被视为 action-type，它的 value 必须是函数，其形式为： `(state, action_payload) => next_state`

page 组件会自动将 page.reducer 对象封装成真正的 reducer 函数，并自动 bindActionCreators。

### page.store

page.store 可以访问到 redux store。

page 组件会自动根据 `page.reducer` 和 `page.getInitialState` 创建一个 `redux store`，并提供 `page.actions` 对象。

page.actions 对象，

### page.actions

page.actions 属性是一个对象，里面的 key 跟 page.reducer 的相同，里面的 value 为函数 `action_payload => next_state`，不需要手动传递 state 参数。

### page.router

page.router 返回 `next/Router` 对象，通常不需要使用它，跳转页面，`page.goto` 方法是更好的途径。

### page.apiPrefix

page.apiPrefix 属性，默认为空字符串，用以补全 fetch 方法的 url 参数。

### page.appPrefix

page.appPrefix 属性，默认为空字符串，用以补全 goto 方法的 url 参数。

### page.immer

page.immer 属性，默认为 true，对 reducer 开启 immer 功能。设为 false，则不开启。

### page.API

page.API 属性，用以影响 fetch 方法的 url，简化 fetch 的 url 长度，见上面的 fetch 文档描述。

### page.reduxDevtools

page.reduxDevtools 属性，默认为 true，开启 redux devtools 功能，设为 false，则不开启。


## Link

如果在 `next.config.js` 里的 `publicRuntimeConfig` 里配置了 `appPrefix` 属性。为避免手动传递 `as` 参数给 `next/link` 组件。

`next-mvc` 提供了 Link 组件，可以更便利地使用。

```jsx
import { Link } from 'next-mvc'

/**
 * appPrefix = /path/to/app
 */
export default function () {
  // will go to /path/to/app/list
  return <Link to="/list">go to list page</Link>
}

```
