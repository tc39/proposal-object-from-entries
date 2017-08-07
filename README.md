# Object.fromEntries

A proposal for a new static method of `Object` in EcmaScript for transforming
key value pairs into an object.

<!-- MarkdownTOC autolink=true bracket=round depth=3 -->

- [Rationale](#rationale)
- [Proposal](#proposal)
- [Behavior](#behavior)
- [Prior Art](#prior-art)
    - [Lodash](#lodash)
    - [Python](#python)
- [Considerations](#considerations)
    - [Symbol keys](#symbol-keys)
    - [Coercion of keys](#coercion-of-keys)
    - [Handling of invalid keys](#handling-of-invalid-keys)
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
        .reduce(([ key, val ]) => Object.assign(acc, { [key]: val }), {});

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
terms of what values it would accept and for what values it would throw, but
instead of initializing a `Map`, an `Object` is initialized, and instead of
getting and calling *adder*, *Set* is used to assign properties to the new
object. That is:

- given `undefined` or `null`, it would return `{}`
- for any other value [*GetIterator*](https://tc39.github.io/ecma262/#sec-getiterator)
  would be called (which may throw a `TypeError`)
- a new empty object (*obj*) is created
- for each *IteratorStep*:
  - if the *IteratorValue* is not an object, a `TypeError` is thrown;
  - *k* and *v* are the properties 0 and 1 of the *IteratorValue*;
  - the type of *k* is asserted to be string (see note in considerations below)
  - [*Set*](https://tc39.github.io/ecma262/#sec-set-o-p-v-throw) is called with
    *obj*, *k*, *v* and *true* — this will throw a `TypeError` is *k* is not
    already a valid property key
- *obj* is returned

## Prior Art

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

### Method name

The name could as easily be `from`, which is consistent with `Array.from`. The
only downsides might be:

- it’s perhaps less clear; it’s comparatively more obvious that `Array.from`
  would accept an iterable
- doesn’t signal its symmetry with `Object.entries`
- could be inconsistent if future methods allow building objects 'from' other
  sources
