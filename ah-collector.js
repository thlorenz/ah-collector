// eslint-disable-next-line camelcase
const async_hooks = require('async_hooks')
const util = require('util')

class ActivityCollector {
  constructor({ start }) {
    this._start = start
    this._activities = new Map()

    this._asyncHook = async_hooks.createHook({
        init    : this._init.bind(this)
      , before  : this._before.bind(this)
      , after   : this._after.bind(this)
      , destroy : this._destroy.bind(this)
    })
  }

  enable() {
    this._asyncHook.enable()
  }

  disable() {
    this._asyncHook.disable()
  }

  activitiesOfTypes(types) {
    if (!Array.isArray(types)) types = [ types ]
    return this.activitiesArray.filter((x) => types.indexOf(x.type) >= 0)
  }

  get activities() {
    return new Map(this._activities)
  }

  get activitiesArray() {
    return Array.from(this._activities.valued())
  }

  _stamp(h, hook) {
    if (h == null) return
    if (h[hook] == null) h[hook] = []
    const time = process.hrtime(this._start)
    h[hook].push((time[0] * 1e9) + time[1])
  }

  _getActivity(uid, hook) {
    const h = this._activities.get(uid)
    if (!h) {
      const stub = { uid, type: 'Unknown' }
      this._activities.set(uid, stub)
      return stub
    }
    return h
  }

  _init(uid, type, triggerId, resource) {
    const activity = { uid, type, triggerId }
    this._stamp(activity, 'init')
    this._activities.set(uid, activity)
  }

  _before(uid) {
    const h = this._getActivity(uid, 'before')
    this._stamp(h, 'before')
  }

  _after(uid) {
    const h = this._getActivity(uid, 'after')
    this._stamp(h, 'after')
  }

  _destroy(uid) {
    const h = this._getActivity(uid, 'destroy')
    this._stamp(h, 'destroy')
  }

  inspect(opts = {}) {
    if (typeof opts === 'string') opts = { types: opts }
    const { types = null, depth = 5, stage = null } = opts
    const activities = types == null
      ? Array.from(this._activities.values())
      : this.activitiesOfTypes(types)

    if (stage != null) console.log('\n%s', stage)
    console.log(util.inspect(activities, false, depth, true))
  }
}

module.exports = ActivityCollector
