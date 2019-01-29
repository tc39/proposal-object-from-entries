# Object.fromEntries

This repository is now archived, since the proposal is stage 4.

A proposal for a new static method `Object.fromEntries` in ECMAScript for transforming a list of key-value pairs into an object.

This proposal was originally written by [Darien Maillet Valentine](https://github.com/bathos) and is being championed by [Jordan Harband](https://github.com/ljharb) and [Kevin Gibbons](https://github.com/bakkot).

<!-- MarkdownTOC autolink=true -->

- [Proposal](#proposal)
- [Rationale](#rationale)
  - [When is this useful?](#when-is-this-useful)
- [Motivating examples](#motivating-examples)
  - [Object-to-object property transformations](#object-to-object-property-transformations)
  - [Object from existing collection](#object-from-existing-collection)
- [Prior art](#prior-art)
  - [Lodash](#lodash)
  - [Python](#python)

<!-- /MarkdownTOC -->

## Proposal

`Object.fromEntries` is proposed to perform the reverse of `Object.entries`: it accepts an iterable of key-value pairs and returns a new object whose own keys and corresponding values are given by those pairs.

```js
obj = Object.fromEntries([['a', 0], ['b', 1]]); // { a: 0, b: 1 }
```

See [DETAILS.md](https://github.com/bakkot/object-from-entries/blob/master/DETAILS.md) for details.


## Rationale

It's common to transform data held in various structures (arrays, maps, etc) from one form to another. When the data structures in question are both iterable this is typically simple:

```js
map = new Map().set('foo', true).set('bar', false);
arr = Array.from(map);
set = new Set(map.values());
```

The iterable entries of a `Map` take the form of key-value pairs. This dovetails nicely with the pairs returned by `Object.entries`, such that you can convert objects to `Map`s fairly expressively:

```js
obj = { foo: true, bar: false };
map = new Map(Object.entries(obj));
```

However there is no inverse of `Object.entries` for constructing objects from key-value pairs, so to do so one typically must write a helper or inline reducer:

```js
obj = Array.from(map).reduce((acc, [ key, val ]) => Object.assign(acc, { [key]: val }), {});
```

This can be written many different ways, and potentially adds noise because it's not likely to be obviously related to the outward purpose of the function doing it.

### When is this useful?

`Object.fromEntries` doesn’t imply a preference for ordinary objects over `Map`.

If you have a collection with an arbitrary set of keys, even if they’re strings,
and especially if you intend to add/remove members over time, `Map` data is
likely a more appropriate model than object properties. Properties are
well-suited to describing interfaces or fixed-shape models, but poorly suited
for modeling arbitrary hashes, and `Map` aims to serve that case better.

We don’t always get to choose the model. This is one of the things `fromEntries`
is meant to help with. Recognizing that some data is an arbitrary collection,
one might prefer to model it using `Map`. Later that data may need to be passed
to an API whose contract expects it to be modeled as an ordinary object though
(think query params, headers, etc): `externalAPI(Object.fromEntries(myMap))`.

Data that comes from or must be serializable to JSON often uses properties to
model arbitrary collections. Metaprogramming that reflects on entries is another
scenario where we may manipulate or filter entries and then wish to convert them
back into an object — for example, when processing objects suitable for passing
to `Object.defineProperties`. For one more example, while not everybody agrees
on whether it’s a good idea, contracts involving arbitrary-key objects may also
be chosen deliberately if an author feels they improve API ergonomics.

## Motivating examples

### Object-to-object property transformations

This allows the easy use of familiar array manipulation methods to transform objects:

```js
obj = { abc: 1, def: 2, ghij: 3 };
res = Object.fromEntries(
  Object.entries(obj)
  .filter(([ key, val ]) => key.length === 3)
  .map(([ key, val ]) => [ key, val * 2 ])
);

// res is { 'abc': 2, 'def': 4 }
```

### Object from existing collection

A string-keyed `Map` can be converted to an object, just as an object can already be converted to a `Map`:

```js
map = new Map([ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]);
obj = Object.fromEntries(map);

// compare existing functionality: new Map(Object.entries(obj))
```

This transformation may be simple for other `Map`-like objects as well:

```js
query = Object.fromEntries(new URLSearchParams('foo=bar&baz=qux'));
```

For other collections, intermediate transformations can put the collection in the required form:

```js
arr = [ { name: 'Alice', age: 40 }, { name: 'Bob', age: 36 } ];
obj = Object.fromEntries(arr.map(({ name, age }) => [ name, age ]));
```

## Prior art

### Lodash

Underscore and Lodash provide a [`_.fromPairs`](https://lodash.com/docs/4.17.4#fromPairs) function which constructs an object from a list of key-value pairs.

### Python

In Python, a `dict` can be initialized with [an array of key-value tuples](https://docs.python.org/3/library/stdtypes.html#dict):

```python
dict([('two', 2), ('one', 1), ('three', 3)])
```
