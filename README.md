# autocombo

no-dependency autocomplete + combobox library ([demo](http://keik.info/autocombo/examples/))

![](https://github.com/keik/autocombo/raw/master/screenshot.png)

short usage:

```js
var inputEl = document.querySelector('input'),
    autoCombo = new AutoCombo(inputEl)

autoCombo.setMenus([
  {text: 'Alice'},
  {text: 'Bob'},
  {text: 'Carol'}
])
```

when `require` this module, babel + es2015 preset are required


# API

## `new AutoCombo(inputEl[, options])`

make specified `inputEl` to autocomplete combobox
`inputEl` need to be `HTMLInputElement`

`options` need to be `object` and following property are available:

* {`array.<object>`} `menus` -
Menus for suggestions. Default value is `[]`. A menu object need `text` property, such like `[{text: 'Alice'}, {text: 'Bob'}, {text: 'Carol'}]`.

* {`string`} `menuContainerClass` -
Class name for menus container element. Default value is `ac-menu-container`.

* {`string`} `menuClass` -
Class name for each menu element. Default value is `ac-menu-container`.

* {`string`} `deleterClass` -
Class name for delete button. Default value is `ac-deleter`

* {`string`} `expanderClass` -
Class name for expand/collaspe button. Default value is `ac-expander`


## `autoCombo#setMenus(menus)`

reset menus with specified `menus`

* {`array.<object>`} `menus`


## `autoCombo#destroy()`

destroy DOM elements and inner objects related to autocombo


# License

MIT (c) keik
