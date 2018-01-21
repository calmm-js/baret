import * as Bacon from "baconjs"

import React, {fromClass, fromBacon} from "../dist/baret.cjs"
import ReactDOM from "react-dom/server"
import PropTypes from "prop-types"

function show(x) {
  switch (typeof x) {
    case "string":
    case "object":
      return JSON.stringify(x)
    default:
      return `${x}`
  }
}

const testRender = (vdom, expect) => it(`${expect}`, () => {
  const actual = ReactDOM.renderToStaticMarkup(vdom)

  if (actual !== expect)
    throw new Error(`Expected: ${show(expect)}, actual: ${show(actual)}`)
})

describe("basics", () => {
  testRender(<p key="k" ref={() => {}}>Hello</p>,
             '<p>Hello</p>')

  testRender(<p id={Bacon.constant("test")}>{null}</p>,
             '<p id="test"></p>')

  testRender(<p key="k" ref={() => {}}>{Bacon.constant("Hello")}</p>,
             '<p>Hello</p>')

  testRender(<p>{[Bacon.constant("Hello")]}</p>,
             '<p>Hello</p>')

  testRender(<p>Just testing <span>constants</span>.</p>,
             '<p>Just testing <span>constants</span>.</p>')

  testRender(<div onClick={() => {}}
                  style={{display: "block",
                          color: Bacon.constant("red"),
                          background: "green"}}>
               <p>{Bacon.constant(["Hello"])}</p>
               <p>{Bacon.constant(["World"])}</p>
             </div>,
             '<div style="display:block;color:red;background:green;"><p>Hello</p><p>World</p></div>')

  testRender(<a href="#lol" style={Bacon.constant({color: "red"})}>
               {Bacon.constant("Hello")} {Bacon.constant("world!")}
             </a>,
             '<a href="#lol" style="color:red;">Hello world!</a>')

  testRender(<div>{Bacon.later(1000,0)}</div>, "")
  testRender(<div>{Bacon.later(1000,0).toProperty(1)}</div>, "<div>1</div>")
  testRender(<div>{Bacon.later(1000,0)} {Bacon.constant(0)}</div>, "")

  const Custom = ({prop, ...props}) => <div>{`${prop} ${JSON.stringify(props)}`}</div>

  testRender(<Custom prop={Bacon.constant("not-lifted")} ref="test"/>,
             '<div>Bacon.constant(not-lifted) {}</div>')

  testRender(<Custom baret-lift prop={Bacon.constant("lifted")} ref="test"/>,
             '<div>lifted {}</div>')

  testRender(<Custom baret-lift prop={"lifted anyway"} ref="test"/>,
             '<div>lifted anyway {}</div>')

  const Spread = props => <div {...props} />

  testRender(<Spread>
               Hello {Bacon.constant("world!")}
             </Spread>,
             '<div>Hello world!</div>')

  testRender(<div><div>a</div>{[<div key="b">b</div>, [<div key="c">c</div>, [<div key="d">d</div>]]]}</div>,
             '<div><div>a</div><div>b</div><div>c</div><div>d</div></div>')

  testRender(<div><div>a</div>{[<div key="b">b</div>, Bacon.constant([<div key="c">c</div>, [<div key="d">d</div>]])]}</div>,
             '<div><div>a</div><div>b</div><div>c</div><div>d</div></div>')

  const ChildrenWithSibling = ({children}) => <div>Test: {children}</div>

  testRender(<ChildrenWithSibling>
               Hello {Bacon.constant("world!")}
             </ChildrenWithSibling>,
             '<div>Test: Hello world!</div>')

  testRender(<span>0</span>, '<span>0</span>')
  testRender(<span>{Bacon.constant(0)}</span>, '<span>0</span>')
})

describe("fromBacon", () => {
  testRender(fromBacon(Bacon.constant(<p>Yes</p>)), '<p>Yes</p>')
})

describe("fromClass", () => {
  const P = fromClass("p")
  testRender(<P $$ref={() => {}}>Hello</P>, '<p>Hello</p>')

  testRender(<P>Hello, {"world"}!</P>, '<p>Hello, world!</p>')
  testRender(<P ref={() => {}}>Hello, {Bacon.constant("world")}!</P>, '<p>Hello, world!</p>')

  testRender(<P>{[Bacon.constant("Hello")]}</P>,
             '<p>Hello</p>')

  testRender(<P>{Bacon.later(1000,0)}</P>, "")
})

describe("context", () => {
  class Context extends React.Component {
    constructor(props) {
      super(props)
    }
    getChildContext() {
      return this.props.context
    }
    render() {
      return <div>{this.props.children}</div>
    }
  }
  Context.childContextTypes = {message: PropTypes.any}

  const Bottom = (_, context) => <div>{Bacon.constant("Bottom")} {context.message}</div>
  Bottom.contextTypes = {message: PropTypes.any}

  const Middle = () => <div>{Bacon.constant("Middle")} <Bottom/></div>
  const Top = () => <div>{Bacon.constant("Top")} <Middle/></div>

  testRender(<Context context={{message: Bacon.constant("Hello")}}><Top/></Context>,
             "<div><div>Top <div>Middle <div>Bottom Hello</div></div></div></div>")
})
