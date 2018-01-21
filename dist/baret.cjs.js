'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var Bacon = require('baconjs');
var Bacon__default = _interopDefault(Bacon);
var infestines = require('infestines');

//

var STYLE = "style";
var CHILDREN = "children";
var LIFT = "baret-lift";
var DD_REF = "$$ref";

//

var reactElement = React.createElement;
var Component = React.Component;

var isObs = function isObs(x) {
  return x instanceof Bacon.Observable;
};
var bacon2 = typeof Bacon__default.Next().value != "function";
var eventValue = bacon2 ? function (e) {
  return e.value;
} : function (e) {
  return e.value();
};
//

var LiftedComponent = /*#__PURE__*/infestines.inherit(function LiftedComponent(props) {
  Component.call(this, props);
}, Component, {
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.componentWillUnmount();
    this.doSubscribe(nextProps);
  },
  componentWillMount: function componentWillMount() {
    this.doSubscribe(this.props);
  }
});

//

var FromBacon = /*#__PURE__*/infestines.inherit(function FromBacon(props) {
  LiftedComponent.call(this, props);
  this.callback = null;
  this.rendered = null;
}, LiftedComponent, {
  componentWillUnmount: function componentWillUnmount() {
    if (this.unsub) this.unsub();
  },
  doSubscribe: function doSubscribe(_ref) {
    var _this = this;

    var observable = _ref.observable;

    if (isObs(observable)) {
      var callback = function callback(e) {
        if (e.hasValue()) {
          _this.rendered = eventValue(e) || null;
          _this.forceUpdate();
        } else if (e.isError()) {
          throw e.error;
        } else if (e.isEnd()) {
          _this.unsub = null;
        }
      };
      this.unsub = observable.subscribe(callback);
    } else {
      this.rendered = observable || null;
    }
  },
  render: function render() {
    return this.rendered;
  }
});

var fromBacon = function fromBacon(observable) {
  return reactElement(FromBacon, { observable: observable });
};

//

function renderChildren(children, at, values) {
  if (isObs(children)) {
    return values[++at[0]];
  } else if (infestines.isArray(children)) {
    var newChildren = children;
    for (var i = 0, n = children.length; i < n; ++i) {
      var childI = children[i];
      var newChildI = childI;
      if (isObs(childI)) {
        newChildI = values[++at[0]];
      } else if (infestines.isArray(childI)) {
        newChildI = renderChildren(childI, at, values);
      }
      if (newChildI !== childI) {
        if (newChildren === children) newChildren = children.slice(0);
        newChildren[i] = newChildI;
      }
    }
    return newChildren;
  } else {
    return children;
  }
}

function renderStyle(style, at, values) {
  var newStyle = undefined;
  for (var i in style) {
    var styleI = style[i];
    if (isObs(styleI)) {
      if (!newStyle) {
        newStyle = {};
        for (var j in style) {
          if (j === i) break;
          newStyle[j] = style[j];
        }
      }
      newStyle[i] = values[++at[0]];
    } else if (newStyle) {
      newStyle[i] = styleI;
    }
  }
  return newStyle || style;
}

function _render(props, values) {
  var type = null;
  var newProps = null;
  var newChildren = null;

  var at = [-1];

  for (var key in props) {
    var val = props[key];
    if (CHILDREN === key) {
      newChildren = renderChildren(val, at, values);
    } else if ("$$type" === key) {
      type = props[key];
    } else if (DD_REF === key) {
      newProps = newProps || {};
      newProps.ref = isObs(val) ? values[++at[0]] : val;
    } else if (isObs(val)) {
      newProps = newProps || {};
      newProps[key] = values[++at[0]];
    } else if (STYLE === key) {
      newProps = newProps || {};
      newProps.style = renderStyle(val, at, values) || val;
    } else {
      newProps = newProps || {};
      newProps[key] = val;
    }
  }

  return newChildren instanceof Array ? reactElement.apply(null, [type, newProps].concat(newChildren)) : null !== newChildren ? reactElement(type, newProps, newChildren) : reactElement(type, newProps);
}

//

function forEachInChildrenArray(children, extra, fn) {
  for (var i = 0, n = children.length; i < n; ++i) {
    var childI = children[i];
    if (isObs(childI)) fn(extra, childI);else if (infestines.isArray(childI)) forEachInChildrenArray(childI, extra, fn);
  }
}

function forEachInProps(props, extra, fn) {
  for (var key in props) {
    var val = props[key];
    if (isObs(val)) {
      fn(extra, val);
    } else if (CHILDREN === key) {
      if (infestines.isArray(val)) forEachInChildrenArray(val, extra, fn);
    } else if (STYLE === key) {
      for (var k in val) {
        var valK = val[k];
        if (isObs(valK)) fn(extra, valK);
      }
    }
  }
}

//

function incValues(self) {
  self.values += 1;
}
function onAny1(handler, obs) {
  handler.unsub = obs.subscribe(handler);
}
function onAny(self, obs) {
  var handler = function handler(e) {
    var handlers = self.handlers;
    var idx = 0;
    while (handlers[idx] !== handler) {
      ++idx;
    } // Found the index of this handler/value
    if (e.hasValue()) {
      var value = eventValue(e);
      var values = self.values;
      if (values[idx] !== value) {
        values[idx] = value;
        self.forceUpdate();
      }
    } else if (e.isError()) {
      throw e.error;
    } else {
      // This is End
      handlers[idx] = null;
      var n = handlers.length;
      if (n !== self.values.length) return;
      for (var i = 0; i < n; ++i) {
        if (handlers[i]) return;
      }self.handlers = null; // No handlers left -> nullify
    }
  };
  self.handlers.push(handler);
  handler.unsub = obs.subscribe(handler);
}

function unsub(handler) {
  if (handler) {
    handler.unsub();
  }
}

var FromClass = /*#__PURE__*/infestines.inherit(function FromClass(props) {
  LiftedComponent.call(this, props);
  this.values = this;
  this.handlers = null;
}, LiftedComponent, {
  componentWillUnmount: function componentWillUnmount() {
    var handlers = this.handlers;
    if (handlers instanceof Function) {
      handlers.unsub();
    } else if (handlers) {
      handlers.forEach(unsub);
    }
  },
  doSubscribe: function doSubscribe(props) {
    var _this2 = this;

    this.values = 0;
    forEachInProps(props, this, incValues);
    var n = this.values; // Here this.values contains the number of observable values. Later on, it'll contain the actual values.

    switch (n) {
      case 0:
        this.values = infestines.array0;
        break;
      case 1:
        {
          this.values = this;
          var handlers = function handlers(e) {
            if (e.hasValue()) {
              var value = eventValue(e);
              if (_this2.values !== value) {
                _this2.values = value;
                _this2.forceUpdate();
              }
            } else if (e.isError()) {
              throw e.error;
            } else {
              // Assume this is End
              _this2.values = [_this2.values];
              _this2.handlers = null;
            }
          };
          this.handlers = handlers;
          forEachInProps(props, handlers, onAny1);
          break;
        }
      default:
        this.values = Array(n).fill(this);
        this.handlers = [];
        forEachInProps(props, this, onAny);
    }
  },
  render: function render() {
    if (this.handlers instanceof Function) {
      var value = this.values;
      if (value === this) return null;
      return _render(this.props, [value]);
    } else {
      var values = this.values;
      for (var i = 0, n = values.length; i < n; ++i) {
        if (values[i] === this) return null;
      }return _render(this.props, values);
    }
  }
});

//

function hasObsInChildrenArray(i, children) {
  for (var n = children.length; i < n; ++i) {
    var child = children[i];
    if (isObs(child) || infestines.isArray(child) && hasObsInChildrenArray(0, child)) return true;
  }
  return false;
}

function hasObsInProps(props) {
  for (var key in props) {
    var val = props[key];
    if (isObs(val)) {
      return true;
    } else if (CHILDREN === key) {
      if (infestines.isArray(val) && hasObsInChildrenArray(0, val)) return true;
    } else if (STYLE === key) {
      for (var k in val) {
        if (isObs(val[k])) return true;
      }
    }
  }
  return false;
}

//

function filterProps(type, props) {
  var newProps = { "$$type": type };
  for (var key in props) {
    var val = props[key];
    if ("ref" === key) newProps[DD_REF] = val;else if (LIFT !== key) newProps[key] = val;
  }
  return newProps;
}

function createElement() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var type = args[0];
  var props = args[1] || infestines.object0;
  if (infestines.isString(type) || props[LIFT]) {
    if (hasObsInChildrenArray(2, args) || hasObsInProps(props)) {
      args[1] = filterProps(type, props);
      args[0] = FromClass;
    } else if (props[LIFT]) {
      args[1] = infestines.dissocPartialU(LIFT, props) || infestines.object0;
    }
  }
  return reactElement.apply(undefined, args);
}

var baret = process.env.NODE_ENV === "production" ? infestines.assocPartialU("createElement", createElement, React) : Object.defineProperty(infestines.assocPartialU("createElement", createElement, infestines.dissocPartialU("PropTypes", React)), "PropTypes", {
  get: function (React$$1) {
    return function () {
      return React$$1.PropTypes;
    };
  }(React)
});

//

var fromClass = function fromClass(Class) {
  return function (props) {
    return reactElement(FromClass, filterProps(Class, props));
  };
};

exports.fromBacon = fromBacon;
exports['default'] = baret;
exports.fromClass = fromClass;
