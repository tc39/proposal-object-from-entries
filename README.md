# Object.fromEntries

A proposal for a new static method of `Object` in EcmaScript for transforming
key value pairs into an object.

<!-- MarkdownTOC autolink=true bracket=round depth=3 -->

- [Rationale](#rationale)
- [Proposal](#proposal)
- [Behavior](#behavior)
- [Runtime semantics](#runtime-semantics)
- [Examples](#examples)
  - [Object-to-object property transformations](#object-to-object-property-transformations)
  - [Object from Map](#object-from-map)
  - [Object from any collection type](#object-from-any-collection-type)
- [Prior art](#prior-art)
  - [Lodash](#lodash)
  - [Python](#python)
- [Considerations](#considerations)
  - [Symbol keys](#symbol-keys)
  - [Coercion of keys](#coercion-of-keys)
  - [Additional arguments](#additional-arguments)
  - [Method name](#method-name)
  - [Alternative or related proposals](#alternative-or-related-proposals)

<!-- /MarkdownTOC -->

## Rationale

It’s common to transform data held in various structures (arrays, maps, etc)
from one form to another. When the data structures in question are both iterable
this is typically simple:

    map = new Map().set('foo', true).set('bar', false);
    arr = Array.from(map);
    set = new Set(map.values());

The iterable entries of a `Map` take the form of key value pairs. This dovetails
nicely with the pairs returned by `Object.entries`, such that you can convert
objects to maps fairly expressively:

    obj = { foo: true, bar: false };
    map = new Map(Object.entries(obj));

However there is no 'mirror' for `Object.entries` that permits constructing
objects from key value pairs, so to do so one typically must write a helper or
inline reducers:

    obj = Array
        .from(map)
        .reduce((acc, [ key, val ]) => Object.assign(acc, { [key]: val }), {});

This can be written many different ways, and potentially adds noise because it’s
not likely to be closely related to the outward purpose of the function doing
it.

## Proposal

A static method, `Object.fromEntries` (named tentatively), that performs the
"reverse" of `Object.entries` — that is, it accepts an iterable of key-value
pairs and returns a new object.

    obj = Object.fromEntries(map);

## Behavior

The following behavior is tentatively proposed; see
[Considerations](#considerations) for possible issues and alternative approaches
that could be taken.

In informal terms, `Object.fromEntries(iter)` would accept an iterable which is
expected to yield entries following the same contract as would be given to the
[`Map` constructor](https://tc39.github.io/ecma262/#sec-map-iterable). Rather
than assemble a map with _adder_, it would coerce keys with _ToPropertyKey_ and
assemble a generic object with _CreateDataPropertyOrThrow_.

## Runtime semantics

I may get this pretty wrong, but an attempt anyway (note Github doesn’t permit
setting the correct list-style-type values for each tier, should be decimal,
alpha, roman):

**19.1.2.x Object.fromEntries([iterable])**

When the `fromEntries` function is called with optional argument, the following
steps are taken:

<ol>
  <li>Let <i>obj</i> be <a href="https://tc39.github.io/ecma262/#sec-objectcreate">ObjectCreate</a>(<a href="https://tc39.github.io/ecma262/#sec-properties-of-the-object-prototype-object">%ObjectPrototype%</a>).</li>
  <li>Let <i>iter</i> be ? <a href="https://tc39.github.io/ecma262/#sec-getiterator">GetIterator</a>(<i>iterable</i>).</li>
  <li>
    Repeat,
    <ol>
      <li>Let <i>next</i> be ? <a href="https://tc39.github.io/ecma262/#sec-iteratorstep">IteratorStep</a>(<i>iter</i>).</li>
      <li>If <i>next</i> is false, return <i>obj</i>.</li>
      <li>Let <i>nextItem</i> be ? <a href="https://tc39.github.io/ecma262/#sec-iteratorvalue">IteratorValue</a>(<i>next</i>).</li>
      <li>
        If <a href="https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values">Type</a>(<i>nextItem</i>) is not Object, then
        <ol>
          <li>
            Let <i>error</i> be <a href="https://tc39.github.io/ecma262/#sec-completion-record-specification-type">Completion</a><tt>{[[Type]]: throw, [[Value]]: a
            newly created <a href="https://tc39.github.io/ecma262/#sec-native-error-types-used-in-this-standard-typeerror">TypeError</a> object, [[Target]]: empty}</tt>.
          </li>
          <li>Return ? <a href="https://tc39.github.io/ecma262/#sec-iteratorclose">IteratorClose</a>(<i>iter</i>, <i>error</i>).</li>
        </ol>
      </li>
      <li>Let <i>key</i> be <a href="https://tc39.github.io/ecma262/#sec-get-o-p">Get</a>(<i>nextItem</i>, "0").</li>
      <li>
        If <i>key</i> is an abrupt completion, return ?
        <a href="https://tc39.github.io/ecma262/#sec-iteratorclose">IteratorClose</a>(<i>iter</i>, <i>key</i>).
      </li>
      <li>
        Let <i>propertyKey</i> be ?
        <a href="http://www.ecma-international.org/ecma-262/8.0/#sec-topropertykey">ToPropertyKey</a>(<i>key</i>).
      </li>
      <li>Let <i>value</i> be <a href="https://tc39.github.io/ecma262/#sec-get-o-p">Get</a>(<i>nextItem</i>, "1").</li>
      <li>
        If <i>value</i> is an abrupt completion, return ? <a href="https://tc39.github.io/ecma262/#sec-iteratorclose">IteratorClose</a>(<i>iter</i>, <i>value</i>).
      </li>
      <li>
        Let <i>defineStatus</i> be <a href="http://www.ecma-international.org/ecma-262/8.0/#sec-createdatapropertyorthrow">CreateDataPropertyOrThrow</a>(<i>obj</i>, <i>propertyKey</i>, <i>value</i>).
      </li>
      <li>
        If <i>defineStatus</i> is an abrupt completion, return ? <a href="https://tc39.github.io/ecma262/#sec-iteratorclose">IteratorClose</a>(<i>iter</i>, <i>defineStatus</i>).
      </li>
    </ol>
  </li>
</ol>

## Examples

### Object-to-object property transformations

Given an object, we can perform map, filter, etc operations readily:

    const obj = { abc: 1, def: 2, ghij: 3 };

    const res = Object.fromEntries(Object
      .entries(obj)
      .filter(([ { length } ]) => length === 3)
      .map(([ key, val ]) => [ val * 2, key ])
    );

    // res is { 2: 'abc', 4: 'def' }

### Object from Map

A string-keyed map can be converted to an object readily, just as an object can
already be converted to a map:

    const map = new Map([ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]);
    const obj = Object.fromEntries(map);

    // compare existing functionality: new Map(Object.entries(obj))

This transformation may be simple for other map-like objects as well:

    const query = Object.fromEntries(new URLSearchParams('foo=bar&baz=qux'));

### Object from any collection type

There’s no single correct definition for what it means to construct a POJO from
an iterable, but any iterable can be converted to entries, whether directly
(using `Array.prototype.entries`, etc) or indirectly (arbitrary mapping).

    const arr = [ { name: 'Alice', age: 40 }, { name: 'Bob', age: 36 } ];
    const obj = Object.fromEntries(arr.map(({ name, age }) => [ name, age ]));

## Prior art

### Lodash

This is already familiar to many EcmaScript developers as the underscore/lodash
method [`_.fromPairs`](https://lodash.com/docs/4.17.4#fromPairs).

In addition, `_.map(obj, fn)`, `_.filter(obj, fn)` `_.invert(obj)`, and
`_.transform(obj, fn)` are more specialized object transformations which are
effectively similar to using existing native Array methods (`map`, `filter`,
`map`, and `map` respectively) on entries when the result is passed to
`fromEntries`.

### Python

In Python, a `dict` can be initialized with
[an array of key-value tuples](https://docs.python.org/3/library/stdtypes.html#dict):

    dict([('two', 2), ('one', 1), ('three', 3)])

## Considerations

### Symbol keys

Symbol keys are permitted, which means that it is possible for
`Object.fromEntries(Object.entries(Object.fromEntries(foo)))` to produce a
different effective result from `Object.fromEntries(foo)`, as the latter could
have symbol keys while the former never would.

<details>
  <p>
    Discussed in [Allowing only strings as keys is harmful #5](issues/5).
    Originally symbol keys were expressly disallowed to ensure consistent
    round-tripping between Object.entries and Object.fromEntries; it seems that
    there’s agreement that the constraint would be more likely to cause
    confusion than help.
  </p>

  <p>Original text:</p>

  <blockquote>
    <p>
      It would be valuable if given an iterable `entries` that
      `Object.entries(Object.fromEntries(entries))` would always return an array
      whose membership (at the key/value level) is identical to `entries`. To
      achieve this behavior, however, we must disallow symbols as keys, because
      `Object.entries` filters out symbol-keyed properties.
    </p>
  </blockquote>
</details>

### Coercion of keys

The keys in entries are coerced to string as they would be when using computed
access or defineOwnProperty, etc.

<details>
  <p>
    Originally a non-string key would have thrown a TypeError. This seems pretty
    undesirable after all; it would not have been consistent with expectations.
  </p>

  <p>Original text:</p>

  <blockquote>
    <p>
      In the proposed behavior above, no coercion of _k_ to a valid property key
      occurs — it must be a string. I believe this is likely the best behavior
      for the use cases envisioned, but possibly users would expect it to behave
      instead like computed assignment, which will attempt coercing any value to
      a property key.
    </p>
    <p>
      Assuming no coercion, and regardless of the restriction on symbol keys,
      one could argue that invalid keys, or perhaps symbol keys specifically,
      should be ignored rather than cause an exception to be thrown. I don’t
      think this is likely the desired behavior, but I figured I should note the
      possibility.
    </p>
  </blockquote>
</details>

### Additional arguments

The `Array.from` method permits a mapping function and a `this` context argument
in addition to the source object. Perhaps it is desirable to do the same here
for consistency. On the other hand, `Array.from` might be seen as a unique case
because of its use case for converting 'array-like' non-iterables, and there is
no analog to that behavior for other collection types.

### Method name

The name could as easily be `from`, which is consistent with `Array.from`. The
only downsides might be:

- it’s perhaps less clear; it’s comparatively more obvious that `Array.from`
  would accept an iterable
- doesn’t signal its symmetry with `Object.entries`
- could be inconsistent if future methods allow building objects 'from' other
  sources

### Alternative or related proposals

- TheNavigateur has put together a proposal for [Array.prototype.toObject](https://github.com/TheNavigateur/arrays-and-other-iterables-to-objects-and-maps)
  and three other instance and static collection methods that cover similar
  territory but eschew working with the entries idiom, instead opting for two
  distinct mapping functions as arguments. The given argument for favoring this
  is that it is potentially less verbose (for the use cases given there) and
  does not imply allocating entry arrays in all cases (though it requires twice
  as many function invocations when the value is not the member itself).
- TJ Crowder proposed `Object.from(iter, stringOrMapFn, target)`, specifically
  addressing the case of mapping members to an object hash, where
  `stringOrMapFn` may be a property key (lodash overloading style) and `target`
  may be an existing object.
