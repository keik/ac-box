var test = require('tape'),
    jsdom = require('jsdom'),
    AutoCombo = require('../src/autocombo')

var window = global.window = jsdom.jsdom('<input id="target" type="text"/>').defaultView,
    document = global.document = window.document

var $ = document.querySelector.bind(document),
    $$ = document.querySelectorAll.bind(document)

test('with default options', function(t) {
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl)

  var menuContainerEl = $('.ac-menu-container')
  t.equal(menuContainerEl.nodeName, 'UL', 'container element should be UL')
  t.equal(menuContainerEl.children.length, 0, 'menu length should be 5')

  var menuEls = $$('.ac-menu')
  t.equal(menuEls.length, 0, 'menu element should not exist')

  var expanderEl = $('.ac-expander')
  t.equal(expanderEl.nodeName, 'SPAN', 'expander element should be SPAN')

  var deleterEl = $('.ac-deleter')
  t.equal(deleterEl.nodeName, 'SPAN', 'deleter element should be SPAN')

  t.end()
  autoCombo.destroy()
})

test('with custom options', function(t) {
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl, {
        menus: [
          {value: 0, text: 'Alice'},
          {value: 1, text: 'Bob'},
          {value: 2, text: 'Carol'},
          {value: 3, text: 'David'},
          {value: 4, text: 'Elen'},
        ],
        menuContainerClass: 'x-menu-container',
        menuClass: 'x-menu',
        deleterClass: 'x-deleter',
        expanderClass: 'x-expander'
      })

  var menuContainerEl = $('.x-menu-container')
  t.equal(menuContainerEl.nodeName, 'UL', 'container element should be UL')
  t.equal(menuContainerEl.children.length, 5, 'menu length shoud be 5')

  var menuEls = $$('.x-menu')
  t.equal(menuEls.length, 5, '5 menu elements should exist')

  var expanderEl = $('.x-expander')
  t.equal(expanderEl.nodeName, 'SPAN', 'expander element should be SPAN')

  var deleterEl = $('.x-deleter')
  t.equal(deleterEl.nodeName, 'SPAN', 'deleter element should be SPAN')

  t.end()
  autoCombo.destroy()
})

test('AutoCombo#setMenus', function(t) {
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl, {
        menus: [
          {value: 0, text: 'Alice'},
          {value: 1, text: 'Bob'},
          {value: 2, text: 'Carol'},
          {value: 3, text: 'David'},
          {value: 4, text: 'Elen'},
        ]})
  t.equal($$('.ac-menu').length, 5, '5 menu element should exist')

  autoCombo.setMenus([
    {value: 1, text: 'Alice'}
  ])
  t.equal($$('.ac-menu').length, 1, '1 menu element should exist')

  t.end()
  autoCombo.destroy()
})
