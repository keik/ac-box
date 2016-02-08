/*
 * https://github.com/keik/ac-box
 * @version v0.0.0
 * @author keik <k4t0.kei@gmail.com>
 * @license MIT
 */

let d = require('debug')('ac-box')

/*
 * load deps
 */

let objectAssign = require('object-assign')

/*
 * load modules
 */

let EventEmitter = require('./event-emitter'),
    MenuStore    = require('./menu-store'),
    keycode      = require('./keycode')

/**
 * @constructor
 * @param {HTMLInputElement} inputEl
 * @param {Object} options
 */
function AcBox(inputEl, options) {
  d('#AcBox')

  /*
   * view state
   */

  this.state = {
    isOpen: null,
    value: null,
    focusedIndex: null
  }

  /*
   * options
   */
  this.options = objectAssign({
    menus: [],
    menuContainerClass: 'ac-menu-container',
    menuClass: 'ac-menu',
    deleterClass: 'ac-deleter',
    expanderClass: 'ac-expander'
  }, options)

  this.dispatcher = new EventEmitter()
  this.store = new MenuStore(this.dispatcher)

  /*
   * intialize DOM elements
   */

  this.inputEl         = inputEl
  this.menuContainerEl = document.createElement('ul')
  this.deleterEl       = document.createElement('span')
  this.expanderEl      = document.createElement('span')
  this.expanderIconEl  = document.createElement('span')

  this.menuContainerEl.className = this.options.menuContainerClass
  this.deleterEl.className       = this.options.deleterClass
  this.deleterEl.tabIndex = -1
  this.deleterEl.textContent = '×'
  this.expanderEl.className       = this.options.expanderClass
  this.expanderEl.tabIndex = -1

  // style
  let computed     = window.getComputedStyle(this.inputEl),
      offsetTop    = this.inputEl.offsetTop,
      offsetLeft   = this.inputEl.offsetLeft,
      offsetWidth  = this.inputEl.offsetWidth,
      offsetHeight = this.inputEl.offsetHeight

  objectAssign(this.menuContainerEl.style, {
    display: 'none',
    position: 'absolute',
    left: offsetLeft + 'px',
    padding: 0,
    margin: 0,
    width: (parseInt(computed.width) + parseInt(computed.borderLeftWidth) + parseInt(computed.borderRightWidth)) + 'px',
    listStyle: 'none',
    boxSizing: 'border-box'
  })

  objectAssign(this.deleterEl.style, {
    display: 'none',
    position: 'absolute',
    left: (offsetLeft + offsetWidth - 18) + 'px',
    top:  + 'px',
    width: '18px',
    height: offsetHeight + 'px',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: offsetHeight + 'px',
    cursor: 'pointer'
  })

  objectAssign(this.expanderEl.style, {
    position: 'absolute',
    left: (offsetLeft + offsetWidth - 18) + 'px',
    top: offsetTop + 'px',
    width: '18px',
    height: offsetHeight + 'px',
    textAlign: 'center',
    cursor: 'pointer'
  })

  objectAssign(this.expanderIconEl.style, {
    display: 'inline-block',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderTop: '4px solid black',
    borderBottom: 'none',
    borderRight: '4px solid transparent'
  })

  // append
  this.expanderEl.appendChild(this.expanderIconEl)
  document.body.appendChild(this.menuContainerEl)
  document.body.appendChild(this.deleterEl)
  document.body.appendChild(this.expanderEl)

  /*
   * UI event handler
   */

  this.inputEl.addEventListener(        'focus',   _onInputFocus.bind(this))
  this.inputEl.addEventListener(        'blur',    _onInputBlur.bind(this))
  this.inputEl.addEventListener(        'keydown', _onInputKeydown.bind(this))
  this.inputEl.addEventListener(        'keyup',   _onInputKeyup.bind(this))
  this.menuContainerEl.addEventListener('click',   _onMenuContainerClick.bind(this))
  this.deleterEl.addEventListener(      'click',   _onDeleterClick.bind(this))
  this.expanderEl.addEventListener(     'click',   _onExpanderClick.bind(this))

  /*
   * Model event handler
   */

  this.store.on('reset', _handleMenuStoreReset.bind(this))

  /*
   * intialize state
   */

  this.dispatcher.emit('reset', this.options.menus)
}

/*
 * methods
 */

objectAssign(AcBox.prototype, {

  /**
   * @param {Array.<Object>} menus
   */
  setMenus: function(menus) {
    d('#setMenus')
    this.dispatcher.emit('reset', menus)
  },

  /**
   * destroy ac-box
   */
  destroy: function() {
    d('#destroy')
    if (this.inputEl)
      this.inputEl.parentNode.appendChild(this.inputEl.cloneNode(true))
    for (let k in this) {
      if (this[k].parentNode)
        this[k].parentNode.removeChild(this[k])
      delete this[k]
    }
  }

})

/*
 * UI event handlers
 */

function _onInputFocus(e) {
  d('#_onInputFocus', e.target, e.relatedTarget, e.explicitOriginalTarget)
  let focusFrom = e.relatedTarget || e.explicitOriginalTarget
  if (focusFrom && focusFrom.parentNode === this.menuContainerEl) {
    // focus from menu
    return
  }

  objectAssign(this.state, {
    isOpen: true
  })
  _render.bind(this)()
}

function _onInputBlur(e) {
  d('#_onInputBlur', e.target, e.relatedTarget, e.explicitOriginalTarget)
  let focusTo = e.relatedTarget || e.explicitOriginalTarget
  if (focusTo &&
      (focusTo.parentNode === this.menuContainerEl
       || focusTo === this.deleterEl
       || focusTo === this.expanderEl)) {

    // if next focus is (menu|deleter|expander), nothing to do
    return
  }

  objectAssign(this.state, {
    isOpen: false
  })
  _render.bind(this)()
}

function _onInputKeydown(e) {
  d('#_onInputKeydown')

  switch (e.keyCode) {
  case keycode.UP:
  case keycode.DOWN:
    // move focus on menus
    let newFocusedIndex,
    [sibling, child] = e.keyCode === keycode.UP ? ['previousSibling', 'lastChild'] : ['nextSibling', 'firstChild'],
    currentFocusedEl = this.menuContainerEl.children[this.state.focusedIndex]
    let nextFocusedEl =  currentFocusedEl && currentFocusedEl[sibling] || this.menuContainerEl[child]
    while (nextFocusedEl && nextFocusedEl.style.display === 'none') {
      nextFocusedEl = nextFocusedEl[sibling]
    }
    if (!nextFocusedEl)
      return
    newFocusedIndex = Array.prototype.indexOf.call(this.menuContainerEl.children, nextFocusedEl)
    objectAssign(this.state, {
      value: nextFocusedEl.textContent,
      focusedIndex: newFocusedIndex
    })
    _render.bind(this)()
    break

  case keycode.ENTER:
    // close menus
    currentFocusedEl = this.menuContainerEl.children[this.state.focusedIndex]
    objectAssign(this.state, {
      isOpen: false
    })
    _render.bind(this)()
    break
  default:
  }
}

function _onInputKeyup(e) {
  d('#_onInputKeyup')
  let newVal = this.inputEl.value
  if (this.state.value === newVal)
    return

  objectAssign(this.state, {
    isOpen: true,
    value: newVal
  })
  _filter.bind(this)()
  _render.bind(this)()
}

function _onMenuContainerClick(e) {
  d('#_onMenuContainerClick', e)
  let newVal = e.target.textContent
  objectAssign(this.state, {
    isOpen: false,
    value: newVal
  })
  _render.bind(this)()
}

function _onDeleterClick(e) {
  d('#_onDeleterClick')
  objectAssign(this.state, {
    isOpen: this.state.isOpen,
    value: ''
  })
  _render.bind(this)()
}

function _onExpanderClick(e) {
  d('#_onExpanderClick')
  objectAssign(this.state, {
    isOpen: !this.state.isOpen
  })
  _render.bind(this)()
}

/*
 * store event handlers
 */

function _handleMenuStoreReset(menus) {
  d('#_handleMenuStoreReset')
  objectAssign(this.state, {
    isOpen: false,
    value: '',
    focusedIndex: null
  })
  _createMenuElements.bind(this)(menus)
}

/*
 * view functions
 */

function _createMenuElements(menus) {
  d('#_createMenuElements')

  // TODO perf
  console.time('_createMenuElements', menus.length)
  let menuContainerEl = this.menuContainerEl
  while (menuContainerEl.firstChild) {
    menuContainerEl.removeChild(menuContainerEl.firstChild)
  }
  let fragment = menus.reduce((acc, menu) => {
    let menuEl = document.createElement('li')
    menuEl.appendChild(document.createTextNode(menu.text))
    menuEl.className = this.options.menuClass
    menuEl.tabIndex = -1
    acc.appendChild(menuEl)
    return acc
  }, document.createDocumentFragment())
  this.menuContainerEl.appendChild(fragment)

  // let html = menus.reduce((acc, menu) => {
  //   return acc += `<li class="${ this.options.menuClass }" tabindex="-1">${ menu.text }</li>`
  // }, '')
  // this.menuContainerEl.innerHTML = html
  console.timeEnd('_createMenuElements', menus.length)
}

/**
 * filter unmatched menu
 */
function _filter() {
  d('#_filter')
  if (!this.state.value) {
    // reset filter and highlight
    Array.prototype.forEach.call(this.menuContainerEl.children, (menuEl) => {
      menuEl.textContent = menuEl.textContent
      menuEl.style.display = ''
    })
  } else {
    // filter and highlight
    Array.prototype.forEach.call(this.menuContainerEl.children, (menuEl) => {
      let re = new RegExp(this.state.value, 'ig')
      if (re.test(menuEl.textContent)) {
        _highlight.bind(this)(menuEl, new RegExp(this.state.value, 'ig'))
        menuEl.style.display = ''
      } else {
        menuEl.style.display = 'none'
      }
    })
  }
}

/**
 * emphashize mached text
 * @param {HTMLElement} el
 * @param {RegExp} regExp
 *
 * ex:
 *   _highlight(<li>Alice</li>, /li/ig)
 *   => <li>A<strong>li</strong>ce</li>
 */
function _highlight(el, regExp) {
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
 * @param {boolean} filter
 */
function _render(filter) {
  d('#_render', this.state)

  // update inputed value
  this.inputEl.value = this.state.value

  if (this.state.isOpen) {
    // show menu
    this.menuContainerEl.style.display = 'block'

    // update unfocused style
    let lastFocusedMenuEls = this.menuContainerEl.querySelectorAll('.focused')
    Array.prototype.forEach.call(lastFocusedMenuEls, (menuEl) => {
      menuEl.className = menuEl.className.replace(/ focused\b/, '')
    })

    // update focused style
    let newFocusedMenuEl = this.menuContainerEl.children[this.state.focusedIndex]
    if (newFocusedMenuEl) {
      newFocusedMenuEl.className = newFocusedMenuEl.className.replace(/ focused\b/, '') + ' focused'

      // update menuContainer scroll position by focusing menu
      // the operation must be ignored from any handlers so set `_stopPropagate` handler templorary
      document.addEventListener('blur', _stopPropagate, true)
      document.addEventListener('focus', _stopPropagate, true)
      newFocusedMenuEl.focus()
      this.inputEl.focus()
      document.removeEventListener('blur', _stopPropagate, true)
      document.removeEventListener('focus', _stopPropagate, true)
    }

    // change expander icon [^]
    objectAssign(this.expanderIconEl.style, {
      borderTop: 'none',
      borderBottom: '4px solid black'
    })

  } else {
    // hide menu
    this.menuContainerEl.style.display = 'none'

    // change expander icon [v]
    objectAssign(this.expanderIconEl.style, {
      borderTop: '4px solid black',
      borderBottom: 'none'
    })

  }

  // toggle deleter
  objectAssign(this.deleterEl.style, {
    display: this.state.value ? 'inline-block' : 'none'
  })

  // toggle expander and change icon
  objectAssign(this.expanderEl.style, {
    display: this.state.value ? 'none' : 'inline-block'
  })
}

/*
 * misc
 */

function _stopPropagate(e) {
  e.stopPropagation()
}

module.exports = AcBox
