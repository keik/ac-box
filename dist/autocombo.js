(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AutoCombo = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":2}],2:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":3}],3:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],4:[function(require,module,exports){
/* eslint-disable no-unused-vars */
'use strict';
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],5:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/*
 * https://github.com/keik/autocombo
 * @version v0.0.0
 * @author keik <k4t0.kei@gmail.com>
 * @license MIT
 */

var d = require('debug')('autocombo');

/*
 * load deps
 */

var objectAssign = require('object-assign');

/*
 * load modules
 */

var EventEmitter = require('./event-emitter'),
    MenuStore = require('./menu-store'),
    keycode = require('./keycode');

/**
 * @constructor
 * @param {HTMLInputElement} inputEl
 * @param {Object} options
 */
function AutoCombo(inputEl, options) {
  d('#AutoCombo');

  /*
   * view state
   */

  this.state = {
    isOpen: null,
    value: null,
    focusedIndex: null
  };

  /*
   * options
   */
  this.options = objectAssign({
    menus: [],
    menuContainerClass: 'ac-menu-container',
    menuClass: 'ac-menu',
    deleterClass: 'ac-deleter',
    expanderClass: 'ac-expander'
  }, options);

  this.dispatcher = new EventEmitter();
  this.store = new MenuStore(this.dispatcher);

  /*
   * intialize DOM elements
   */

  this.inputEl = inputEl;
  this.menuContainerEl = document.createElement('ul');
  this.deleterEl = document.createElement('span');
  this.expanderEl = document.createElement('span');
  this.expanderIconEl = document.createElement('span');

  this.menuContainerEl.className = this.options.menuContainerClass;
  this.deleterEl.className = this.options.deleterClass;
  this.deleterEl.tabIndex = -1;
  this.deleterEl.textContent = '×';
  this.expanderEl.className = this.options.expanderClass;
  this.expanderEl.tabIndex = -1;

  // style
  var computed = window.getComputedStyle(this.inputEl),
      offsetTop = this.inputEl.offsetTop,
      offsetLeft = this.inputEl.offsetLeft,
      offsetWidth = this.inputEl.offsetWidth,
      offsetHeight = this.inputEl.offsetHeight;

  objectAssign(this.menuContainerEl.style, {
    display: 'none',
    position: 'absolute',
    left: offsetLeft + 'px',
    padding: 0,
    margin: 0,
    width: parseInt(computed.width) + parseInt(computed.borderLeftWidth) + parseInt(computed.borderRightWidth) + 'px',
    listStyle: 'none',
    boxSizing: 'border-box'
  });

  objectAssign(this.deleterEl.style, {
    display: 'none',
    position: 'absolute',
    left: offsetLeft + offsetWidth - 18 + 'px',
    top: +'px',
    width: '18px',
    height: offsetHeight + 'px',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: offsetHeight + 'px',
    cursor: 'pointer'
  });

  objectAssign(this.expanderEl.style, {
    position: 'absolute',
    left: offsetLeft + offsetWidth - 18 + 'px',
    top: offsetTop + 'px',
    width: '18px',
    height: offsetHeight + 'px',
    textAlign: 'center',
    cursor: 'pointer'
  });

  objectAssign(this.expanderIconEl.style, {
    display: 'inline-block',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderTop: '4px solid black',
    borderBottom: 'none',
    borderRight: '4px solid transparent'
  });

  // append
  this.expanderEl.appendChild(this.expanderIconEl);
  document.body.appendChild(this.menuContainerEl);
  document.body.appendChild(this.deleterEl);
  document.body.appendChild(this.expanderEl);

  /*
   * UI event handler
   */

  this.inputEl.addEventListener('focus', _onInputFocus.bind(this));
  this.inputEl.addEventListener('blur', _onInputBlur.bind(this));
  this.inputEl.addEventListener('keydown', _onInputKeydown.bind(this));
  this.inputEl.addEventListener('keyup', _onInputKeyup.bind(this));
  this.menuContainerEl.addEventListener('click', _onMenuContainerClick.bind(this));
  this.deleterEl.addEventListener('click', _onDeleterClick.bind(this));
  this.expanderEl.addEventListener('click', _onExpanderClick.bind(this));

  /*
   * Model event handler
   */

  this.store.on('reset', _handleMenuStoreReset.bind(this));

  /*
   * intialize state
   */

  this.dispatcher.emit('reset', this.options.menus);
}

/*
 * methods
 */

objectAssign(AutoCombo.prototype, {

  /**
   * @param {Array.<Object>} menus
   */
  setMenus: function setMenus(menus) {
    d('#setMenus');
    this.dispatcher.emit('reset', menus);
  },

  /**
   * destroy autocombo
   */
  destroy: function destroy() {
    d('#destroy');
    if (this.inputEl) this.inputEl.parentNode.appendChild(this.inputEl.cloneNode(true));
    for (var k in this) {
      if (this[k].parentNode) this[k].parentNode.removeChild(this[k]);
      delete this[k];
    }
  }

});

/*
 * UI event handlers
 */

function _onInputFocus(e) {
  d('#_onInputFocus', e.target, e.relatedTarget, e.explicitOriginalTarget);
  var focusFrom = e.relatedTarget || e.explicitOriginalTarget;
  if (focusFrom && focusFrom.parentNode === this.menuContainerEl) {
    // focus from menu
    return;
  }

  objectAssign(this.state, {
    isOpen: true
  });
  _render.bind(this)();
}

function _onInputBlur(e) {
  d('#_onInputBlur', e.target, e.relatedTarget, e.explicitOriginalTarget);
  var focusTo = e.relatedTarget || e.explicitOriginalTarget;
  if (focusTo && (focusTo.parentNode === this.menuContainerEl || focusTo === this.deleterEl || focusTo === this.expanderEl)) {

    // if next focus is (menu|deleter|expander), nothing to do
    return;
  }

  objectAssign(this.state, {
    isOpen: false
  });
  _render.bind(this)();
}

function _onInputKeydown(e) {
  d('#_onInputKeydown');

  switch (e.keyCode) {
    case keycode.UP:
    case keycode.DOWN:
      // move focus on menus
      var newFocusedIndex = undefined;

      var _ref = e.keyCode === keycode.UP ? ['previousSibling', 'lastChild'] : ['nextSibling', 'firstChild'];

      var _ref2 = _slicedToArray(_ref, 2);

      var sibling = _ref2[0];
      var child = _ref2[1];
      var currentFocusedEl = this.menuContainerEl.children[this.state.focusedIndex];
      var nextFocusedEl = currentFocusedEl && currentFocusedEl[sibling] || this.menuContainerEl[child];
      while (nextFocusedEl && nextFocusedEl.style.display === 'none') {
        nextFocusedEl = nextFocusedEl[sibling];
      }
      if (!nextFocusedEl) return;
      newFocusedIndex = Array.prototype.indexOf.call(this.menuContainerEl.children, nextFocusedEl);
      objectAssign(this.state, {
        value: nextFocusedEl.textContent,
        focusedIndex: newFocusedIndex
      });
      _render.bind(this)();
      break;

    case keycode.ENTER:
      // close menus
      currentFocusedEl = this.menuContainerEl.children[this.state.focusedIndex];
      objectAssign(this.state, {
        isOpen: false
      });
      _render.bind(this)();
      break;
    default:
  }
}

function _onInputKeyup(e) {
  d('#_onInputKeyup');
  var newVal = this.inputEl.value;
  if (this.state.value === newVal) return;

  objectAssign(this.state, {
    isOpen: true,
    value: newVal
  });
  _filter.bind(this)();
  _render.bind(this)();
}

function _onMenuContainerClick(e) {
  d('#_onMenuContainerClick', e);
  var newVal = e.target.textContent;
  objectAssign(this.state, {
    isOpen: false,
    value: newVal
  });
  _render.bind(this)();
}

function _onDeleterClick(e) {
  d('#_onDeleterClick');
  objectAssign(this.state, {
    isOpen: this.state.isOpen,
    value: ''
  });
  _render.bind(this)();
}

function _onExpanderClick(e) {
  d('#_onExpanderClick');
  objectAssign(this.state, {
    isOpen: !this.state.isOpen
  });
  _render.bind(this)();
}

/*
 * store event handlers
 */

function _handleMenuStoreReset(menus) {
  d('#_handleMenuStoreReset');
  objectAssign(this.state, {
    isOpen: false,
    value: '',
    focusedIndex: null
  });
  _createMenuElements.bind(this)(menus);
}

/*
 * view functions
 */

function _createMenuElements(menus) {
  var _this = this;

  d('#_createMenuElements');

  // TODO perf
  console.time('_createMenuElements', menus.length);
  var menuContainerEl = this.menuContainerEl;
  while (menuContainerEl.firstChild) {
    menuContainerEl.removeChild(menuContainerEl.firstChild);
  }
  var fragment = menus.reduce(function (acc, menu) {
    var menuEl = document.createElement('li');
    menuEl.appendChild(document.createTextNode(menu.text));
    menuEl.className = _this.options.menuClass;
    menuEl.tabIndex = -1;
    acc.appendChild(menuEl);
    return acc;
  }, document.createDocumentFragment());
  this.menuContainerEl.appendChild(fragment);

  // let html = menus.reduce((acc, menu) => {
  //   return acc += `<li class="${ this.options.menuClass }" tabindex="-1">${ menu.text }</li>`
  // }, '')
  // this.menuContainerEl.innerHTML = html
  console.timeEnd('_createMenuElements', menus.length);
}

/**
 * filter unmatched menu
 */
function _filter() {
  var _this2 = this;

  d('#_filter');
  if (!this.state.value) {
    // reset filter and highlight
    Array.prototype.forEach.call(this.menuContainerEl.children, function (menuEl) {
      menuEl.textContent = menuEl.textContent;
      menuEl.style.display = '';
    });
  } else {
    // filter and highlight
    Array.prototype.forEach.call(this.menuContainerEl.children, function (menuEl) {
      var re = new RegExp(_this2.state.value, 'ig');
      if (re.test(menuEl.textContent)) {
        _highlight.bind(_this2)(menuEl, new RegExp(_this2.state.value, 'ig'));
        menuEl.style.display = '';
      } else {
        menuEl.style.display = 'none';
      }
    });
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
  var text = el.textContent,
      m = undefined,
      lastlast = undefined,
      html = '';
  while (m = regExp.exec(text)) {
    html += text.substring(lastlast, m.index) + '<strong>' + text.substring(m.index, regExp.lastIndex) + '</strong>';
    lastlast = regExp.lastIndex;
  }
  html += text.substring(lastlast);
  el.innerHTML = html;
}

/**
 * render by current state
 * @param {boolean} filter
 */
function _render(filter) {
  d('#_render', this.state);

  // update inputed value
  this.inputEl.value = this.state.value;

  if (this.state.isOpen) {
    // show menu
    this.menuContainerEl.style.display = 'block';

    // update unfocused style
    var lastFocusedMenuEls = this.menuContainerEl.querySelectorAll('.focused');
    Array.prototype.forEach.call(lastFocusedMenuEls, function (menuEl) {
      menuEl.className = menuEl.className.replace(/ focused\b/, '');
    });

    // update focused style
    var newFocusedMenuEl = this.menuContainerEl.children[this.state.focusedIndex];
    if (newFocusedMenuEl) {
      newFocusedMenuEl.className = newFocusedMenuEl.className.replace(/ focused\b/, '') + ' focused';

      // update menuContainer scroll position by focusing menu
      // the operation must be ignored from any handlers so set `_stopPropagate` handler templorary
      document.addEventListener('blur', _stopPropagate, true);
      document.addEventListener('focus', _stopPropagate, true);
      newFocusedMenuEl.focus();
      this.inputEl.focus();
      document.removeEventListener('blur', _stopPropagate, true);
      document.removeEventListener('focus', _stopPropagate, true);
    }

    // change expander icon [^]
    objectAssign(this.expanderIconEl.style, {
      borderTop: 'none',
      borderBottom: '4px solid black'
    });
  } else {
    // hide menu
    this.menuContainerEl.style.display = 'none';

    // change expander icon [v]
    objectAssign(this.expanderIconEl.style, {
      borderTop: '4px solid black',
      borderBottom: 'none'
    });
  }

  // toggle deleter
  objectAssign(this.deleterEl.style, {
    display: this.state.value ? 'inline-block' : 'none'
  });

  // toggle expander and change icon
  objectAssign(this.expanderEl.style, {
    display: this.state.value ? 'none' : 'inline-block'
  });
}

/*
 * misc
 */

function _stopPropagate(e) {
  e.stopPropagation();
}

module.exports = AutoCombo;

},{"./event-emitter":6,"./keycode":7,"./menu-store":8,"debug":1,"object-assign":4}],6:[function(require,module,exports){
'use strict';

var d = require('debug')('dispatcher');

/*
 * load deps
 */

var objectAssign = require('object-assign');

function EventEmitter() {
  d('#EventEmitter');
  this.handlers = {};
}

objectAssign(EventEmitter.prototype, {

  on: function on(type, handler) {
    if (!Array.isArray(this.handlers[type])) this.handlers[type] = [];
    this.handlers[type].push(handler);
  },

  emit: function emit(type, data) {
    if (Array.isArray(this.handlers[type])) this.handlers[type].forEach(function (handler) {
      return handler(data);
    });
  }

});

module.exports = EventEmitter;

},{"debug":1,"object-assign":4}],7:[function(require,module,exports){
"use strict";

module.exports = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  ENTER: 13,
  ESC: 27,
  TAB: 9
};

},{}],8:[function(require,module,exports){
'use strict';

var d = require('debug')('menu-store');

/*
 * load deps
 */

var objectAssign = require('object-assign');

/*
 * load modules
 */

var EventEmitter = require('./event-emitter');

/**
 * @coustructor
 * @param {EventEmitter} dippatcher
 * @param {Array.<Object>} menus
 */
function MenuStore(dispatcher, menus) {
  d('#MenuStore');
  EventEmitter.call(this);
  this.dispatcher = dispatcher;
  this.menus = menus;
  this.dispatcher.on('reset', _resetMenus.bind(this));
}

// extend
objectAssign(MenuStore.prototype, EventEmitter.prototype);

/*
 * methods
 */

objectAssign(MenuStore.prototype, {

  getAll: function getAll() {
    d('#getAll');
    return this.menus;
  }

});

/*
 * private methods
 */

function _resetMenus(menus) {
  d('#_resetMenus');
  this.menus = menus;
  this.emit('reset', menus);
}

module.exports = MenuStore;

},{"./event-emitter":6,"debug":1,"object-assign":4}]},{},[5])(5)
});