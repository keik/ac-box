/*
 * https://github.com/keik/autocombo
 * @version v0.0.0
 * @author keik <k4t0.kei@gmail.com>
 * @license MIT
 */

let d = require('debug')('autocombo')

/*
 * load deps
 */

let objectAssign = require('object-assign')

/*
 * load modules
 */

let EventEmitter = require('./event-emitter'),
    MenuStore = require('./menu-store')

/**
 * @constructor
 * @param {HTMLInputElement} inputEl
 * @param {Object} options
 */
function AutoCombo(inputEl, options) {
  d('#AutoCombo')
  this.state = {
    isOpen: null,
    value: null
  }

  this.options = objectAssign({
    menus: [],
    menuContainerClass: 'ac-menu-container',
    menuClass: 'ac-menu',
    togglerClass: 'ac-toggler'
  })

  this.dispatcher = new EventEmitter()
  this.store = new MenuStore(this.dispatcher)

  /*
   * intialize DOM elements
   */

  this.inputEl         = inputEl
  this.menuContainerEl = document.createElement('ul')
  this.togglerEl       = document.createElement('span')

  this.menuContainerEl.className = this.options.menuContainerClass
  this.togglerEl.className       = this.options.togglerClass

  let computed = window.getComputedStyle(this.inputEl)
  objectAssign(this.menuContainerEl.style, {
    display: 'none',
    position: 'absolute',
    left: this.inputEl.offsetLeft + 'px',
    padding: 0,
    margin: 0,
    width: (parseInt(computed.width) + parseInt(computed.borderLeftWidth) + parseInt(computed.borderRightWidth)) + 'px',
    listStyle: 'none',
    boxSizing: 'border-box'
  })

  // objectAssign(this.togglerEl.style, {
  //   display: 'inline-block',
  //   position: 'absolute',
  //   top: this.inputEl.offsetTop + 'px',
  //   left: (this.inputEl.offsetLeft + this.inputEl.offsetWidth - 18) + 'px',
  //   padding: 0,
  //   margin: 0,
  //   width: '18px',
  //   height: this.inputEl.offsetHeight + 'px',
  //   backgroundColor: 'red',
  //   listStyle: 'none'
  // })

  this.togglerEl.textContent = 'X'
  document.body.appendChild(this.menuContainerEl)
  document.body.appendChild(this.togglerEl)

  /*
   * UI event handler
   */
  this.inputEl.addEventListener('focus',    _onInputFocus.bind(this))
  this.inputEl.addEventListener('focusout', _onInputFocusout.bind(this))
  this.inputEl.addEventListener('keyup',    _onInputKeyup.bind(this))

  /*
   * Model event handler
   */
  this.store.on('reset', _handleMenuStoreReset.bind(this))

}

/*
 * methods
 */

objectAssign(AutoCombo.prototype, {

  /**
   * @param {Array.<Object>} menus
   */
  setMenus: function(menus) {
    d('#setMenus')
    this.dispatcher.emit('reset', menus)
  }

})

/*
 * UI event handlers
 */

function _onInputFocus() {
  d('#_onInputFocus')
  objectAssign(this.state, {
    isOpen: true
  })
  _render.bind(this)()
}

function _onInputFocusout() {
  d('#_onInputFocusout')
  objectAssign(this.state, {
    isOpen: false
  })
  _render.bind(this)()
}

function _onInputKeyup() {
  d('#_onInputKeyup')

  let newVal = this.inputEl.value
  if (this.state.value === newVal)
    return

  objectAssign(this.state, {
    value: newVal
  })
  _filter.bind(this)()
  _render.bind(this)()
}

/*
 * store event handlers
 */

function _handleMenuStoreReset(menus) {
  d('#_handleMenuStoreReset')
  _createMenuElements.bind(this)(this.store.getAll())
}

/*
 * view functions
 */

function _createMenuElements(menus) {
  d('#_createMenuElements')

  // TODO perf
  let menuContainerEl = this.menuContainerEl
  while (menuContainerEl.firstChild) {
    menuContainerEl.removeChild(menuContainerEl.firstChild)
  }

  let fragment = menus.reduce((acc, menu) => {
    let menuEl = document.createElement('li')
    menuEl.textContent = menu.text
    menuEl.className = this.options.menuClass
    acc.appendChild(menuEl)
    return acc
  }, document.createDocumentFragment())
  this.menuContainerEl.appendChild(fragment)
}

/**
 * filter unmatched menu
 */
function _filter() {
  d('#_filter')

  if (!this.state.value) {
    // show all
    Array.prototype.forEach.call(this.menuContainerEl.children, (menuEl) => {
      menuEl.textContent = menuEl.textContent
      menuEl.style.display = ''
    })
  } else {
    // filter and highlight
    Array.prototype.forEach.call(this.menuContainerEl.children, (menuEl) => {
      let re = new RegExp(this.state.value, 'ig')
      if (re.test(menuEl.textContent)) {
        _highlight.bind(this)(menuEl, new RegExp(this.state.value, 'ig'), 'strong')
        menuEl.style.display = ''
      } else {
        menuEl.style.display = 'none'
      }
    })
  }
}

/**
 * emphashize mached text
 */
function _highlight(el, regExp, indicator) {
  // d('#_highlight')
  // TODO perf
  let text = el.textContent,
      m,
      lastlast,
      html = ''
  while ((m = regExp.exec(text))) {
    html += (`${ text.substring(lastlast, m.index) }<strong>${ text.substring(m.index, regExp.lastIndex) }</strong>`)
    lastlast = regExp.lastIndex
  }
  html += text.substring(lastlast)
  el.innerHTML = html
}

/**
 * render by current state
 */
function _render() {
  d('#_render')
  this.menuContainerEl.style.display = this.state.isOpen ? 'block' : 'none'
}

module.exports = AutoCombo
