# ac-box

no-dependency autocomplete + combobox library ([demo](http://keik.info/ac-box/examples/))

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

when `require` ac-box, babel + es2015 preset are required


# Styling

position related properties will be configured automatically

on the other hand, decoration related properties such like `border` or `background-color` will not be configured,
so you have to configure CSS for menu container element or menu elements, etc. see [source of demo](https://github.com/keik/ac-box/blob/master/examples/basic.html)


# API

## `new AcBox(inputEl[, options])`

make specified `inputEl` to autocomplete combobox
`inputEl` need to be `HTMLInputElement`

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

reset menus with specified `menus`

* {`array.<object>`} `menus`


## `AcBox#destroy()`

destroy DOM elements and inner objects related to ac-box


# License

MIT (c) keik
