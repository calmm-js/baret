[ [≡](#contents) | [Tutorial](#tutorial) | [Reference](#reference) ]

# Baret

Baret is a library that allows you to
embed [Bacon.js](https://baconjs.github.io/) observables
into [React](https://facebook.github.io/react/) Virtual DOM.  Embedding
observables into VDOM has the following benefits:
* It allows you to use
  only
  [functional components](https://facebook.github.io/react/docs/components-and-props.html#functional-and-class-components),
  because you can then use observables for managing state
  and [`ref`](https://facebook.github.io/react/docs/refs-and-the-dom.html) for
  component lifetime, leading to more **_concise code_**.
* It helps you to use React in an **_algorithmically efficient_** way:
  * The body of a functional component is evaluated only once each time the
    component is mounted.
    * This also helps you to avoid issues such as
      the
      [gotcha with ref](https://facebook.github.io/react/docs/refs-and-the-dom.html#caveats).
  * Only elements that contain embedded observables are rerendered when changes
    are pushed through observables.  An update to a deeply nested VDOM element
    can be an O(1) operation.

Using Baret couldn't be simpler.  You just `import React from "karet"` and you
are good to go.

[![npm version](https://badge.fury.io/js/karet.svg)](http://badge.fury.io/js/karet)
[![Gitter](https://img.shields.io/gitter/room/calmm-js/chat.js.svg)](https://gitter.im/calmm-js/chat)
[![Build Status](https://travis-ci.org/calmm-js/karet.svg?branch=master)](https://travis-ci.org/calmm-js/karet)
[![Code Coverage](https://img.shields.io/codecov/c/github/calmm-js/karet/master.svg)](https://codecov.io/github/calmm-js/karet?branch=master)
[![](https://david-dm.org/calmm-js/karet.svg)](https://david-dm.org/calmm-js/karet)
[![](https://david-dm.org/calmm-js/karet/dev-status.svg)](https://david-dm.org/calmm-js/karet?type=dev)

## Contents

* [Tutorial](#tutorial)
* [Reference](#reference)
  * [`karet-lift` attribute](#karet-lift)
  * [`fromBacon(observableVDOM)`](#fromBacon "fromBacon: Observable VDOM -> VDOM")
  * [`fromClass(Component)`](#fromClass "fromClass: Component props -> Component (Observable props)")
    * [`$$ref` attribute](#ref)

## Tutorial

To use Baret, you simply import it as `React`:

```jsx
import React from "karet"
```

and you can then write React components:

```jsx
const oncePerSecond = Bacon.interval(1000).toProperty()

const Clock = () =>
  <div>
    The time is {oncePerSecond.map(() => new Date().toString())}.
  </div>
```

with VDOM that can have embedded [Bacon.js](https://baconjs.github.io/)
observables.

**NOTE:** The result, like the `Clock` above, is *just* a React component.  If
you export it, you can use it just like any other React component and even in
modules that do not import `karet`.

## Reference

### <a name="karet-lift"></a> [≡](#contents) [`karet-lift` attribute](#karet-lift)

Baret only lifts built-in HTML elements implicitly.  The `karet-lift` attribute
on a non-primitive element instructs Baret to lift the element.

For example, you could write:

```jsx
import * as RR from "react-router"
import React   from "karet"

const Link1 = ({...props}) => <RR.Link karet-lift {...props}/>
```

to be able to use `Link1` with
embedded [Bacon.js](https://baconjs.github.io/) observables:

```jsx
<Link1 href="https://www.youtube.com/watch?v=Rbm6GXllBiw"
       ref={elem => elem && elem.focus()}>
  {Bacon.sequentially(1000, [3, 2, 1, "Boom!"])}
</Link1>
```

Note that the `ref` attribute is only there as an example to contrast
with [`$$ref`](#ref).

### <a name="fromBacon"></a> [≡](#contents) [`fromBacon(observableVDOM)`](#fromBacon "fromBacon: Observable VDOM -> VDOM")

`fromBacon` allows one to convert a Bacon observable of React elements into a
React element.  It is useful in case the top-most element of a component depends
on a Bacon observable.

For example:

```jsx
import {fromBacon} from "karet"
import {ifte} from "karet.util"

const Chosen = ({choice}) =>
  fromBacon(ifte(choice, <True/>, <False/>))
```

Here `ifte` from `karet-util` returns an observable that is `<True/>` when
`choice` is true and otherwise `<False/>`.

Note that the point of using `fromBacon` in the above example is that we don't
want to wrap the `ifte(...)` inside an additional element like this:

```jsx
const Chosen = ({choice}) =>
  <div>
    {ifte(choice, <True/>, <False/>)}
  </div>
```

### <a name="fromClass"></a> [≡](#contents) [`fromClass(Component)`](#fromClass "fromClass: Component props -> Component (Observable props)")

`fromClass` allows one to lift a React component.

For example:

```jsx
import * as RR from "react-router"
import {fromClass} from "karet"

const Link2 = fromClass(RR.Link)
```

**WARNING:** A difficulty with lifting components is that you will then need to
use the [`$$ref`](#ref) attribute, which is not necessary when
using [`karet-lift`](#karet-lift) to lift an element.

#### <a name="ref"></a> [≡](#contents) [`$$ref` attribute](#ref)

The `$$ref` attribute on an element whose component is lifted using `fromClass`

```jsx
<Link2 href="https://www.youtube.com/watch?v=Rbm6GXllBiw"
       $$ref={elem => elem && elem.focus()}>
  {Bacon.sequentially(1000, [3, 2, 1, "Boom!"])}
</Link2>
```

does the same thing as the ordinary
JSX
[`ref` attribute](https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute):
JSX/React treats `ref` as a special case and it is not passed to components, so
a special name had to be introduced for it.
