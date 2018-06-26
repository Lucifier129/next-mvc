const cookie = require("cookie")

const get = (name, req) => {
  const cookies = cookie.parse(req.headers.cookie)
  return cookies[name]
}

const set = (name, value, options, res) => {
  const opts = Object.assign({}, options)
  const val =
    typeof value === "object" ? "j:" + JSON.stringify(value) : String(value)

  if ("maxAge" in opts) {
    opts.expires = new Date(Date.now() + opts.maxAge)
    opts.maxAge /= 1000
  }

  if (opts.path == null) {
    opts.path = "/"
  }

  res.setHeader("Set-Cookie", cookie.serialize(name, String(val), opts))
}

const remove = (name, options, res) => {
  const opts = merge({ expires: new Date(1), path: "/" }, options)
  return set(name, "", opts, res)
}

module.exports = { get, set, remove }
