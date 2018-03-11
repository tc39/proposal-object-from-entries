# Object.fromEntries

A proposal for a new static method `Object.fromEntries` in ECMAScript for transforming a list of key-value pairs into an object.

<!-- MarkdownTOC autolink=true bracket=round depth=3 -->

- [Proposal](#proposal)
- [Rationale](#rationale)
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
obj = Object.fromEntries([['a', 0], ['b', 1]]); // { a: 0, b: 1}
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
