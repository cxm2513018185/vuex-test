let Vue;

// 封装、优化代码
const forEach = (obj, callback) => {
  Object.keys(obj).forEach((keyName) => {
    callback(keyName, obj[keyName]);
  })
}

// 模块收集
class ModuleCollection {
  constructor(options) {
    this.root = null;
    this.register([], options)
  }
  register(pathArr, rootModule) {
    // 初始模块对象
    let newModule = {
      _raw: rootModule,
      _children: {},
      state: rootModule.state,
    }
    if (pathArr.length === 0) { // 记录根节点
      this.root = newModule;
    } else { // 子模块
      let parent = pathArr.slice(0, -1).reduce((root, current) => {
        return this.root._children[current];
      }, this.root)
      if (parent) {
        parent._children[pathArr[pathArr.length - 1]] = newModule;
      }
    }
    // 递归
    if (rootModule.modules) {
      forEach(rootModule.modules, (moduleName, module) => {
        this.register(pathArr.concat(moduleName), module);
      }) 
    }
  }
}

class Store {
  constructor(options) {
    // 定义响应式数据
    this.vm = new Vue({
      data() {
        return {
          state: options.state,
        }
      }
    })

    // for gettters
    this.getters = {};
    const getters = options.getters || {};
    // Object.keys(getters).forEach((getterName) => {
    //   Object.defineProperty(this.getters, getterName, {
    //     get: () => {
    //       return getters[getterName](this.state);
    //     }
    //   })
    // })
    forEach(getters, (getterName, fn) => {
      Object.defineProperty(this.getters, getterName, {
        get: () => {
          return fn(this.state);
        }
      })
    })

    // for mutations
    this.mutations = {};
    const mutations = options.mutations || {};
    // Object.keys(mutations).forEach((mutationName) => {
    //   this.mutations[mutationName] = (payload) => {
    //     mutations[mutationName](this.state, payload);
    //   }
    // })
    forEach(mutations, (mutationName, fn) => {
      this.mutations[mutationName] = (payload) => {
        fn(this.state, payload);
      }
    })

    // for actions
    this.actions = {};
    const actions = options.actions || {};
    // Object.keys(actions).forEach((actionName) => {
    //   this.actions[actionName] = (payload) => {
    //     actions[actionName](this, payload);
    //   }
    // })
    forEach(actions, (actionName, fn) => {
      this.actions[actionName] = (payload) => {
        fn(this, payload);
      }
    })

    // for modules(待完善)
    this.modules = new ModuleCollection(options);
    console.log('@@@this.modules: ', this.modules);
  }
  
  // state
  get state() {
    return this.vm.state;
  }

  // commit
  commit = (type, payload) => {
    this.mutations[type](payload);
  }

  // dispatch
  dispatch(type, payload) {
    this.actions[type](payload);
  }
}

const install = (_Vue) => {
  Vue = _Vue;
  Vue.mixin({
    beforeCreate() {
      if (this.$options && this.$options.store) { // Root
        this.$store = this.$options.store;
      } else {  // Children
        this.$store = this.$parent && this.$parent.$store;
      }
    }
  })
}

export default {
  install,
  Store,
}