let d = require('debug')('menu-store')

/*
 * load deps
 */

let objectAssign = require('object-assign')

/*
 * load modules
 */

let EventEmitter = require('./event-emitter')

/**
 * @coustructor
 * @param {EventEmitter} dippatcher
 * @param {Array.<Object>} menus
 */
function MenuStore(dispatcher, menus) {
  d('#MenuStore')
  EventEmitter.call(this)
  this.dispatcher = dispatcher
  this.menus = menus
  this.dispatcher.on('reset', _resetMenus.bind(this))
}

// extend
objectAssign(MenuStore.prototype, EventEmitter.prototype)

/*
 * methods
 */

objectAssign(MenuStore.prototype, {

  getAll: function() {
    d('#getAll')
    return this.menus
  }

})

/*
 * private methods
 */

function _resetMenus(menus) {
  d('#_resetMenus')
  this.menus = menus
  this.emit('reset', menus)
}

module.exports = MenuStore
