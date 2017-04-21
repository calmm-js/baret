'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var baconjs = require('baconjs');
var infestines = require('infestines');

//

var STYLE = "style";
var CHILDREN = "children";
var BARET = "baret-lift";
var DD_REF = "$$ref";

//

var reactElement = React.createElement;
var Component = React.Component;

var isObs = function isObs(x) {
  return x instanceof baconjs.Observable;
};

//

function LiftedComponent(props) {
  Component.call(this, props);
}

infestines.inherit(LiftedComponent, Component, {
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.doUnsubscribe();
    this.doSubscribe(nextProps);
  },
  componentWillMount: function componentWillMount() {
    this.doSubscribe(this.props);
  },
  componentWillUnmount: function componentWillUnmount() {
    this.doUnsubscribe();
  }
});

//

function FromBacon(props) {
  LiftedComponent.call(this, props);
  this.callback = null;
  this.rendered = null;
}

infestines.inherit(FromBacon, LiftedComponent, {
  doUnsubscribe: function doUnsubscribe() {
    if (this.unsub) this.unsub();
  },
  doSubscribe: function doSubscribe(_ref) {
    var _this = this;

    var observable = _ref.observable;

    if (isObs(observable)) {
      var callback = function callback(e) {
        if (e.hasValue()) {
          _this.rendered = e.value() || null;
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

function forEach(props, extra, fn) {
  for (var key in props) {
    var val = props[key];
    if (isObs(val)) {
      fn(extra, val);
    } else if (CHILDREN === key) {
      if (infestines.isArray(val)) {
        for (var i = 0, n = val.length; i < n; ++i) {
          var valI = val[i];
          if (isObs(valI)) fn(extra, valI);
        }
      }
    } else if (STYLE === key) {
      for (var k in val) {
        var valK = val[k];
        if (isObs(valK)) fn(extra, valK);
      }
    }
  }
}

function _render(props, values) {
  var type = null;
  var newProps = null;
  var newChildren = null;

  var k = -1;

  for (var key in props) {
    var val = props[key];
    if (CHILDREN === key) {
      if (isObs(val)) {
        newChildren = values[++k];
      } else if (infestines.isArray(val)) {
        for (var i = 0, n = val.length; i < n; ++i) {
          var valI = val[i];
          if (isObs(valI)) {
            if (!newChildren) {
              newChildren = Array(n);
              for (var j = 0; j < i; ++j) {
                newChildren[j] = val[j];
              }
            }
            newChildren[i] = values[++k];
          } else if (newChildren) newChildren[i] = valI;
        }
        if (!newChildren) newChildren = val;
      } else {
        newChildren = val;
      }
    } else if ("$$type" === key) {
      type = props[key];
    } else if (DD_REF === key) {
      newProps = newProps || {};
      newProps.ref = isObs(val) ? values[++k] : val;
    } else if (isObs(val)) {
      newProps = newProps || {};
      newProps[key] = values[++k];
    } else if (STYLE === key) {
      var newStyle = void 0;
      for (var _i in val) {
        var _valI = val[_i];
        if (isObs(_valI)) {
          if (!newStyle) {
            newStyle = {};
            for (var _j in val) {
              if (_j === _i) break;
              newStyle[_j] = val[_j];
            }
          }
          newStyle[_i] = values[++k];
        } else if (newStyle) {
          newStyle[_i] = _valI;
        }
      }
      newProps = newProps || {};
      newProps.style = newStyle || val;
    } else {
      newProps = newProps || {};
      newProps[key] = val;
    }
  }

  return newChildren instanceof Array ? reactElement.apply(null, [type, newProps].concat(newChildren)) : newChildren ? reactElement(type, newProps, newChildren) : reactElement(type, newProps);
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
    return self.doHandleN(handler, e);
  };
  self.handlers.push(handler);
  handler.unsub = obs.subscribe(handler);
}

function unsub(handler) {
  if (handler) {
    handler.unsub();
  }
}

function FromClass(props) {
  LiftedComponent.call(this, props);
  this.values = this;
  this.handlers = null;
}

infestines.inherit(FromClass, LiftedComponent, {
  doUnsubscribe: function doUnsubscribe() {
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
    forEach(props, this, incValues);
    var n = this.values; // Here this.values contains the number of observable values. Later on, it'll contain the actual values.

    switch (n) {
      case 0:
        this.values = infestines.array0;
        break;
      case 1:
        {
          this.values = this;
          var handlers = function handlers(e) {
            return _this2.doHandle1(e);
          };
          this.handlers = handlers;
          forEach(props, handlers, onAny1);
          break;
        }
      default:
        this.values = Array(n).fill(this);
        this.handlers = [];
        forEach(props, this, onAny);
    }
  },
  doHandle1: function doHandle1(e) {
    if (e.hasValue()) {
      var value = e.value();
      if (this.values !== value) {
        this.values = value;
        this.forceUpdate();
      }
    } else if (e.isError()) {
      throw e.error;
    } else {
      // Assume this is End
      this.values = [this.values];
      this.handlers = null;
    }
  },
  doHandleN: function doHandleN(handler, e) {
    var handlers = this.handlers;
    var idx = 0;
    while (handlers[idx] !== handler) {
      ++idx;
    } // Found the index of this handler/value
    if (e.hasValue()) {
      var value = e.value();
      var values = this.values;
      if (values[idx] !== value) {
        values[idx] = value;
        this.forceUpdate();
      }
    } else if (e.isError()) {
      throw e.error;
    } else {
      // This is End
      handlers[idx] = null;
      var n = handlers.length;
      if (n !== this.values.length) return;
      for (var i = 0; i < n; ++i) {
        if (handlers[i]) return;
      }this.handlers = null; // No handlers left -> nullify
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

function hasObsInProps(props) {
  for (var key in props) {
    var val = props[key];
    if (isObs(val)) {
      return true;
    } else if (CHILDREN === key) {
      if (infestines.isArray(val)) for (var i = 0, n = val.length; i < n; ++i) {
        if (isObs(val[i])) return true;
      }
    } else if (STYLE === key) {
      for (var k in val) {
        if (isObs(val[k])) return true;
      }
    }
  }
  return false;
}

function hasObsInArgs(args) {
  for (var i = 2, n = args.length; i < n; ++i) {
    var arg = args[i];
    if (infestines.isArray(arg)) {
      for (var j = 0, m = arg.length; j < m; ++j) {
        if (isObs(arg[j])) return true;
      }
    } else if (isObs(arg)) {
      return true;
    }
  }
  return hasObsInProps(args[1]);
}

function filterProps(type, props) {
  var newProps = { "$$type": type };
  for (var key in props) {
    var val = props[key];
    if ("ref" === key) newProps[DD_REF] = val;else if (BARET !== key) newProps[key] = val;
  }
  return newProps;
}

function hasLift(props) {
  return props && props[BARET] === true;
}

function createElement() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var type = args[0];
  var props = args[1];
  if (infestines.isString(type) || hasLift(props)) {
    if (hasObsInArgs(args)) {
      args[1] = filterProps(type, props);
      args[0] = FromClass;
    } else if (hasLift(props)) {
      args[1] = infestines.dissocPartialU(BARET, props) || infestines.object0;
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
