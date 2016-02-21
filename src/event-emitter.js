let d = require('debug')('ac-box:event-emitter')

/*
 * load deps
 */

let objectAssign = require('object-assign')

function EventEmitter() {
  d('#EventEmitter')
  this.handlers = {}
}

objectAssign(EventEmitter.prototype, {

  on: function(type, handler) {
    if (!Array.isArray(this.handlers[type]))
      this.handlers[type] = []
    this.handlers[type].push(handler)
  },

  emit: function(type, data) {
    if (Array.isArray(this.handlers[type]))
      this.handlers[type].forEach(handler => handler(data))
  }

})

module.exports = EventEmitter
