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

test('focus input', function(t) {
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl, {
        menus: [
          {value: 0, text: 'Alice'},
          {value: 1, text: 'Bob'},
          {value: 2, text: 'Carol'},
          {value: 3, text: 'David'},
          {value: 4, text: 'Elen'},
        ]})

  t.equal(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'in default, menu should be collapsed')
  inputEl.dispatchEvent(new window.MouseEvent('focus'))
  t.notEqual(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'focus to input, and menu should be expanded')

  t.end()
  autoCombo.destroy()
})

test('blur input', function(t) {
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl, {
        menus: [
          {value: 0, text: 'Alice'},
          {value: 1, text: 'Bob'},
          {value: 2, text: 'Carol'},
          {value: 3, text: 'David'},
          {value: 4, text: 'Elen'},
        ]})

  inputEl.dispatchEvent(new window.MouseEvent('focus'))
  t.notEqual(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'focus to input, and menu should be expanded')

  inputEl.dispatchEvent(new window.MouseEvent('blur'))
  t.equal(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'blur to window, and menu should be collapsed')

  t.end()
  autoCombo.destroy()
})

test('click menu', function(t) {
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl, {
        menus: [
          {value: 0, text: 'Alice'},
          {value: 1, text: 'Bob'},
          {value: 2, text: 'Carol'},
          {value: 3, text: 'David'},
          {value: 4, text: 'Elen'},
        ]})

  inputEl.dispatchEvent(new window.MouseEvent('focus'))
  t.notEqual(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'focus to input, and menu should be expanded')

  $$('.ac-menu')[1].dispatchEvent(new window.MouseEvent('click', {bubbles: true}))
  t.equal(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'click to menu, and menu should be collapsed')
  t.equal(inputEl.value, 'Bob', 'click to menu "Bob", and input value should change to "Bob"')

  t.end()
  autoCombo.destroy()
})

test('input chars and filter', function(t) {
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl, {
        menus: [
          {value: 0, text: 'Alice'},
          {value: 1, text: 'Bob'},
          {value: 2, text: 'Carol'},
          {value: 3, text: 'David'},
          {value: 4, text: 'Elen'},
        ]})

  inputEl.dispatchEvent(new window.MouseEvent('focus'))
  t.notEqual(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'focus to input, and menu should be expanded')

  inputEl.value = 'a'
  inputEl.dispatchEvent(new window.KeyboardEvent('keyup'))
  t.notEqual(window.getComputedStyle($('.ac-menu-container')).display, 'none', 'focus to input, and menu should be expanded')
  t.equal($$('.ac-menu')[0].innerHTML, '<strong>A</strong>lice', 'Alice should be emphasized')
  t.equal($$('.ac-menu')[1].innerHTML, 'Bob', 'Bob should not be emphasized')
  t.equal($$('.ac-menu')[2].innerHTML, 'C<strong>a</strong>rol', 'Carol should be emphasized')
  t.equal($$('.ac-menu')[3].innerHTML, 'D<strong>a</strong>vid', 'David should be emphasized')
  t.equal($$('.ac-menu')[4].innerHTML, 'Elen', 'Elen should not be emphasized')
  t.notEqual(window.getComputedStyle($$('.ac-menu')[0]).display, 'none', 'Alice should be shown')
  t.equal(window.getComputedStyle($$('.ac-menu')[1]).display, 'none', 'Bob should not be shown')
  t.notEqual(window.getComputedStyle($$('.ac-menu')[2]).display, 'none', 'Carol should be shown')
  t.notEqual(window.getComputedStyle($$('.ac-menu')[3]).display, 'none', 'David should be shown')
  t.equal(window.getComputedStyle($$('.ac-menu')[4]).display, 'none', 'Elen should not be shown')

  t.end()
  autoCombo.destroy()
})
