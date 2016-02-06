/*
 * https://github.com/keik/autocombo
 * @version v0.0.0
 * @author keik <k4t0.kei@gmail.com>
 * @license MIT
 */


let MenuStore = require('./menu-store')

/**
 * @constructor
 * @param {HTMLInputElement} inputEl
 * @param {Object} options
 */
function AutoCombo(inputEl, options) {

  this.state = {
    isOpen: null,
    value: null
  }

  this.inputEl = inputEl
  this.store = new MenuStore()

  /*
   * UI event handler
   */
  this.inputEl.addEventListener('mousedown', _onInputMousedown.bind(this))

  /*
   * Model event handler
   */
  this.store.on('reset', _handleMenuStoreReset.bind(this))

}

/*
 * methods
 */

Object.assign(AutoCombo.prototype, {

  /**
   * @param {Array.<Object>} menus
   */
  setMenus: function(menus) {
    console.log('setMenus')
  }

})

function _onInputMousedown() {
  console.log('_onInputMousedown')
}

function _handleMenuStoreReset() {
  console.log('_handleMenuStoreReset')
}

module.exports = AutoCombo
