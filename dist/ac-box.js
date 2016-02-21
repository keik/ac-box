(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AcBox = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/*
 * https://github.com/keik/ac-box
 * @version v0.1.1
 * @author keik <k4t0.kei@gmail.com>
 * @license MIT
 */
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
function AcBox(inputEl, options) {
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
    this.expanderIconEl = document.createElement('div');
    this.menuContainerEl.className = this.options.menuContainerClass;
    this.deleterEl.className = this.options.deleterClass;
    this.deleterEl.tabIndex = -1;
    this.deleterEl.textContent = '\xD7';
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
        top: offsetTop + offsetHeight + 'px',
        padding: 0,
        margin: 0,
        width: parseInt(computed.width) + parseInt(computed.borderLeftWidth) + parseInt(computed.borderRightWidth) + 'px',
        maxHeight: window.innerHeight - offsetTop - offsetHeight - 12 + 'px',
        overflow: 'auto',
        listStyle: 'none',
        boxSizing: 'border-box'
    });
    objectAssign(this.deleterEl.style, {
        display: 'none',
        position: 'absolute',
        left: offsetLeft + offsetWidth - 18 + 'px',
        top: offsetTop + 'px',
        width: '16px',
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
        width: '16px',
        height: offsetHeight + 'px',
        textAlign: 'center',
        cursor: 'pointer'
    });
    objectAssign(this.expanderIconEl.style, {
        display: 'block',
        width: 0,
        height: 0,
        margin: (offsetHeight - 4) / 2 + 'px 4px 0 4px',
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
    this.handlers = {};
    this.handlers['onWindowResize'] = _onWindowResize.bind(this);
    window.addEventListener('resize', this.handlers['onWindowResize']);
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
objectAssign(AcBox.prototype, {
    /**
    * @param {Array.<Object>} menus
    */
    setMenus: function setMenus(menus) {
        this.dispatcher.emit('reset', menus);
    },
    /**
    * destroy ac-box
    */
    destroy: function destroy() {
        if (this.inputEl) this.inputEl.parentNode.appendChild(this.inputEl.cloneNode(true));
        if (this.handlers) window.removeEventListener('resize', this.handlers['onWindowResize']);
        for (var k in this) {
            if (this[k].parentNode) this[k].parentNode.removeChild(this[k]);
            delete this[k];
        }
    }
});
/*
 * UI event handlers
 */
function _onWindowResize(e) {
    var computed = window.getComputedStyle(this.inputEl),
        offsetTop = this.inputEl.offsetTop,
        offsetLeft = this.inputEl.offsetLeft,
        offsetWidth = this.inputEl.offsetWidth,
        offsetHeight = this.inputEl.offsetHeight;
    objectAssign(this.menuContainerEl.style, {
        left: offsetLeft + 'px',
        top: offsetTop + offsetHeight + 'px',
        width: parseInt(computed.width) + parseInt(computed.borderLeftWidth) + parseInt(computed.borderRightWidth) + 'px'
    });
    objectAssign(this.deleterEl.style, {
        left: offsetLeft + offsetWidth - 18 + 'px',
        top: offsetTop + 'px',
        height: offsetHeight + 'px'
    });
    objectAssign(this.expanderEl.style, {
        left: offsetLeft + offsetWidth - 18 + 'px',
        top: offsetTop + 'px',
        height: offsetHeight + 'px'
    });
}
function _onInputFocus(e) {
    var focusFrom = e.relatedTarget || e.explicitOriginalTarget;
    if (focusFrom && focusFrom.parentNode === this.menuContainerEl) {
        // focus from menu
        return;
    }
    objectAssign(this.state, { isOpen: true });
    _render.bind(this)();
}
function _onInputBlur(e) {
    var focusTo = e.relatedTarget || e.explicitOriginalTarget;
    if (focusTo && (focusTo.parentNode === this.menuContainerEl || focusTo === this.deleterEl || focusTo === this.expanderEl)) {
        // if next focus is (menu|deleter|expander), nothing to do
        return;
    }
    objectAssign(this.state, { isOpen: false });
    _render.bind(this)();
}
function _onInputKeydown(e) {
    switch (e.keyCode) {
        case keycode.UP:
        case keycode.DOWN:
            // move focus on menus
            var newFocusedIndex = undefined;
            var _ref = e.keyCode === keycode.UP ? ['previousSibling', 'lastChild'] : ['nextSibling', 'firstChild'];

            var _ref2 = _slicedToArray(_ref, 2);

            var sibling = _ref2[0];
            var child = _ref2[1];var currentFocusedEl = this.menuContainerEl.children[this.state.focusedIndex];
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
            objectAssign(this.state, { isOpen: false });
            _render.bind(this)();
            break;
        default:
    }
}
function _onInputKeyup(e) {
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
    var newVal = e.target.textContent;
    objectAssign(this.state, {
        isOpen: false,
        value: newVal
    });
    _filter.bind(this)();
    _render.bind(this)();
}
function _onDeleterClick(e) {
    objectAssign(this.state, {
        isOpen: this.state.isOpen,
        value: ''
    });
    this.inputEl.focus();
    _filter.bind(this)();
    _render.bind(this)();
}
function _onExpanderClick(e) {
    objectAssign(this.state, { isOpen: !this.state.isOpen });
    _render.bind(this)();
}
/*
 * store event handlers
 */
function _handleMenuStoreReset(menus) {
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

    // TODO perf
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
    this.menuContainerEl.appendChild(fragment) // let html = menus.reduce((acc, menu) => {
    //   return acc += `<li class="${ this.options.menuClass }" tabindex="-1">${ menu.text }</li>`
    // }, '')
    // this.menuContainerEl.innerHTML = html
    ;
}
/**
 * filter unmatched menu
 */
function _filter() {
    var _this2 = this;

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
    // update inputed value
    this.inputEl.value = this.state.value;
    if (this.state.isOpen) {
        // show menu
        this.menuContainerEl.style.display = 'block';
        this.menuContainerEl.style.maxHeight = window.innerHeight - this.menuContainerEl.offsetTop - 12 + 'px';
        document.body.style.overflow = 'hidden';
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
        document.body.style.overflow = '';
        // change expander icon [v]
        objectAssign(this.expanderIconEl.style, {
            borderTop: '4px solid black',
            borderBottom: 'none'
        });
    }
    // toggle deleter
    objectAssign(this.deleterEl.style, { display: this.state.value ? '' : 'none' });
    // toggle expander and change icon
    objectAssign(this.expanderEl.style, { display: this.state.value ? 'none' : '' });
}
/*
 * misc
 */
function _stopPropagate(e) {
    e.stopPropagation();
}
module.exports = AcBox;

},{"./event-emitter":3,"./keycode":4,"./menu-store":5,"object-assign":1}],3:[function(require,module,exports){
'use strict';

/*
 * load deps
 */
var objectAssign = require('object-assign');
function EventEmitter() {
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

},{"object-assign":1}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

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
    return this.menus;
  }
});
/*
 * private methods
 */
function _resetMenus(menus) {
  this.menus = menus;
  this.emit('reset', menus);
}
module.exports = MenuStore;

},{"./event-emitter":3,"object-assign":1}]},{},[2])(2)
});