# Object.fromEntries

A proposal for a new static method of `Object` in EcmaScript for transforming
key value pairs into an object.

<!-- MarkdownTOC autolink=true bracket=round depth=3 -->

- [Rationale](#rationale)
- [Proposal](#proposal)
- [Behavior](#behavior)
- [Runtime semantics](#runtime-semantics)
- [Prior art](#prior-art)
    - [Lodash](#lodash)
    - [Python](#python)
- [Considerations](#considerations)
    - [Symbol keys](#symbol-keys)
    - [Coercion of keys](#coercion-of-keys)
    - [Handling of invalid keys](#handling-of-invalid-keys)
    - [Additional arguments](#additional-arguments)
    - [Method name](#method-name)

<!-- /MarkdownTOC -->

## Rationale

It’s common to transform data held in various structures (arrays, maps, etc)
from one form to another. When the data structures in question are both iterable
this is typically simple:

    map = new Map().set('foo', true).set('bar', false);
    arr = Array.from(map);
    set = new Set(map);

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

The following behavior is tentatively proposed; see [#considerations] for
possible issues and alternative approaches that could be taken.

In informal terms, `Object.fromEntries(iter)` would mimic the relevent behaviors
of the [`Map` constructor](https://tc39.github.io/ecma262/#sec-map-iterable) in
terms of what values it would accept and for what values it would throw, with
the additional constraint that the _key_ of each entry be a string, and rather
than assemble a map with _adder_, it would assemble a generic object with _Set_.

Referenced internals would be:

- [Completion](https://tc39.github.io/ecma262/#sec-completion-record-specification-type)
- [Get](https://tc39.github.io/ecma262/#sec-get-o-p)
- [GetIterator](https://tc39.github.io/ecma262/#sec-getiterator)
- [IteratorClose](https://tc39.github.io/ecma262/#sec-iteratorclose)
- [IteratorStep](https://tc39.github.io/ecma262/#sec-iteratorstep)
- [IteratorValue](https://tc39.github.io/ecma262/#sec-iteratorvalue)
- [ObjectCreate](https://tc39.github.io/ecma262/#sec-objectcreate)
- [Set](https://tc39.github.io/ecma262/#sec-set-o-p-v-throw)
- [Type](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values)
- [TypeError](https://tc39.github.io/ecma262/#sec-native-error-types-used-in-this-standard-typeerror)
- [%ObjectPrototype%](https://tc39.github.io/ecma262/#sec-properties-of-the-object-prototype-object)

## Runtime semantics

I may get this pretty wrong, but an attempt anyway:

```
19.1.2.x Object.fromEntries([iterable])

When the `fromEntries` function is called with optional argument, the following
steps are taken:

  1. Let _obj_ be ObjectCreate(%ObjectPrototype%).
  2. If _iterable_ is not present, let _iterable_ be undefined.
  3. If _iterable_ is either undefined or null, return _obj_.
  4. Let _iter_ be ? GetIterator(_iterable_).
  5. Repeat,
     a. Let _next_ be ? IteratorStep(_iter_).
     b. If _next_ is false, return _obj_.
     c. Let _nextItem_ be ? IteratorValue(_next_).
     d. If Type(_nextItem_) is not Object, then
        i.  Let _error_ be Completion{[[Type]]: throw, [[Value]]: a newly
            created TypeError object, [[Target]]: empty}.
        ii. Return ? IteratorClose(_iter_, _error_).
     e. Let _k_ be Get(_nextItem_, "0").
     f. If _k_ is an abrupt completion, return ? IteratorClose(_iter_, _k_).
     g. If Type(_k_) is not String, then
        i.  Let _error_ be Completion{[[Type]]: throw, [[Value]]: a newly
            created TypeError object, [[Target]]: empty}.
        ii. Return ? IteratorClose(_iter_, _error_).
     h. Let _v_ be Get(_nextItem_, "1").
     i. If _v_ is an abrupt completion, return ? IteratorClose(_iter_, _v_).
     j. Perform Set(_obj_, _k_, _v_, true). // True redundant here I think.
```

## Prior art

### Lodash

This is already familiar to many EcmaScript developers as the underscore/lodash
method [`_.fromPairs`](https://lodash.com/docs/4.17.4#fromPairs).

### Python

In Python, a `dict` can be initialized with
[an array of key-value tuples](https://docs.python.org/3/library/stdtypes.html#dict):

    dict([('two', 2), ('one', 1), ('three', 3)])

## Considerations

### Symbol keys

It would be valuable if given an iterable `entries` that
`Object.entries(Object.fromEntries(entries))` would always return an array whose
membership (at the key/value level) is identical to `entries`. To achieve this
behavior, however, we must disallow symbols as keys, because `Object.entries`
filters out symbol-keyed properties.

### Coercion of keys

In the proposed behavior above, no express coercion of *key* to a property key
occurs. I believe this is likely the best behavior for the use cases envisioned,
but possibly users would expect it to behave instead like computed assignment,
which will attempt coercing any value to a property key.

### Handling of invalid keys

Assuming no coercion, and regardless of the restriction on symbol keys, one
could argue that invalid keys, or perhaps symbol keys specifically, should be
ignored rather than case an exception to be thrown. I don’t think this is likely
the desired behavior, but I figured I should note the possibility.

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
