function MenuStore() {

  this.handlers = []

}

Object.assign(MenuStore.prototype, {

  on: function(type, handler) {
    if (!Array.isArray(this.handlers[type]))
      this.handlers[type] = []
    this.handlers[type].push(handler)
  },

  emit: function(type, data) {
    if (Array.isArray(this.handlers[type]))
      this.handlers[type].forEach(handler => handler(data))
  },

  getMenus: function() {
    return this.menus
  }

})

module.exports = MenuStore
