var test = require('tape'),
    jsdom = require('jsdom'),
    AutoCombo = require('../src/autocombo')

var window = global.window = jsdom.jsdom('<input id="target" type="text"/>').defaultView,
    document = global.document = window.document

var $ = document.querySelector.bind(document),
    $$ = document.querySelectorAll.bind(document)

test('with default options', function(t) {
  t.test('')
  var inputEl = $('#target'),
      autoCombo = new AutoCombo(inputEl)

  var menuContainerEl = $('.ac-menu-container')
  t.equal(menuContainerEl.nodeName, 'UL')
  t.equal(menuContainerEl.children.length, 0)

  var expanderEl = $('.ac-expander')
  t.equal(expanderEl.nodeName, 'SPAN')
  t.equal(expanderEl.children.length, 0)

  var deleterEl = $('.ac-deleter')
  t.equal(deleterEl.nodeName, 'SPAN')
  t.equal(deleterEl.children.length, 0)

  t.end()
})
