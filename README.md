# ac-box

no-dependency, lightweight autocomplete combobox UI library ([demo](http://keik.info/ac-box/examples/))

![](https://github.com/keik/ac-box/raw/master/screenshot.png)

short usage:

```js
var inputEl = document.querySelector('input'),
    acbox = new AcBox(inputEl)

acbox.setMenus([
  {text: 'Alice'},
  {text: 'Bob'},
  {text: 'Carol'}
])
```


# Installation

## Node

```
npm install ac-box
```

```javascript
var AcBox = require('ac-box')
```

When using with [Browserify](https://github.com/substack/node-browserify), `babelily` and `babel-preset-es2015` are required.


## Browser

Download via `npm` or [releases](https://github.com/keik/ac-box/releases) and load standalone build version [dist/ac-box.js](./dist/ac-box.js)

```html
<script src="ac-box/dist/ac-box.js"></script>
<script>
  var inputEl = document.querySelector('input'),
      acbox = new AcBox(inputEl)
</script>
```


# Styling

Position related CSS properties will be configured automatically.

On the other hand, decoration related properties like `border` or `background-color` will not be configured automatically,
so we have to configure CSS for menu container element or menu elements, etc. see [source of demo](https://github.com/keik/ac-box/blob/master/examples/basic.html)


# API

## `new AcBox(inputEl[, options])`

Make specified `inputEl` to autocomplete combobox.
`inputEl` need to be `HTMLInputElement`.

`options` need to be `object` and following property are available:

* {`array.<object>`} `menus` -
Menus for suggestions. Default value is `[]`. A menu object need `text` property, such like `[{text: 'Alice'}, {text: 'Bob'}, {text: 'Carol'}]`.

* {`string`} `menuContainerClass` -
Class name for menus container element. Default value is `ac-menu-container`.

* {`string`} `menuClass` -
Class name for each menu element. Default value is `ac-menu`.

* {`string`} `deleterClass` -
Class name for delete button. Default value is `ac-deleter`

* {`string`} `expanderClass` -
Class name for expand/collaspe button. Default value is `ac-expander`


## `AcBox#setMenus(menus)`

Reset menus with specified `menus`.

* {`array.<object>`} `menus`


## `AcBox#destroy()`

Destroy DOM elements and inner objects related to ac-box.


# License

MIT (c) keik
