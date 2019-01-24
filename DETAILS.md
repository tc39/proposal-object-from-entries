# Details

There are number of decisions which could be made differently. This document attempts to catalog them along with the rationales for the choices currently made.


### Naming

The method in this proposal is named `fromEntries`. There already exists `Array.from`, and there is [a proposal](https://github.com/tc39/proposal-setmap-offrom) to add `{Set, Map, WeakSet, WeakMap}.from`; it could be argued that the method in this proposal should therefore be named `.from` for consistency.

However, this is less of a "canonical" way of constructing objects than those methods are or would be, especially since this method does not provide for defining non-data properties or setting a prototype. As such, `fromEntries` was chosen instead, to match `Object.entries`.

Issue: [#7](https://github.com/bakkot/object-from-entries/issues/7).


### Placement

This proposal adds a static method to `Object`. In principle the same functionality could be provided by a similar function elsewhere, e.g. `Array.prototype.toObject`.

This proposal instead chooses consistency with `Object.entries` and `Array.from`.


### `ToPropertyKey`

This proposal coerces the first entry in the list of pairs to a property key using the [ToPropertyKey](https://tc39.github.io/ecma262/#sec-topropertykey) abstract operation.

This is consistent with other methds of creating or assigning to properties on objects.


### Symbol keys

`Object.entries` does not report Symbol-keyed entries, but this proposal allows their creation (for example, `let prop = Symbol(); let obj = Object.fromEntries([[prop, 0]]); console.log(obj[prop]);` will report `0`). This means that `Object.entries(Object.fromEntries(arr))` may yield an array with fewer elements than `arr`.

However, `fromEntries` is strictly more useful this way, and any other behavior would probably be more surprising.

Issue: [#5](https://github.com/bakkot/object-from-entries/issues/5).


### List of records vs list of iterables

`fromEntries` expects the key-value pairs yielded by its argument to be objects with keys `"0"` and `"1"` which give the key and value respectively, rather than being iterables whose first and second items give the key and value respectively.

This was chosen for consistency with the [`Map` constructor](https://tc39.github.io/ecma262/#sec-map-iterable), which takes a list of entires in precisely the same way (except that it does not coerce keys with `ToPropertyKey`).

In the common case of arrays as this behavior is equivalent unless someone has overridden `Array.prototype[@@iterator]`.


### Requirement that records be objects

This proposal throws if the iterator yields a value which is not an object (that is, an `x` such that `Object(x) !== x`). This means that, for example, yielding a length-2 `string` will not work, even though the later steps which access the `"0"` and `"1"` properties would succeed and then use the first and second character of the string as the key and value respectively of a property on the resulting object.

This is consistent with the `Map` constructor.


### Iterable or array-like

This proposal requires its first argument to be an iterable, not an "array-like" (an object with a number-valued `length` property and possibly number-keyed properties). This means that passing, for example, an `arguments` object will cause this method to throw (assuming no one has defined `Object.prototype[@@iterator]`). This is inconsistent with `Array.from`, which accepts "array-likes".

However, the behavior of `Array.from` is very specifically [intended for the conversion of array-likes](https://github.com/tc39/proposal-setmap-offrom/issues/3#issue-175135115), and does not need to be copied elsewhere.

Issue: [#9](https://github.com/bakkot/object-from-entries/issues/9).


### Non-optionality of argument

This proposal's first argument is not optional, meaning a `TypeError` is thrown if it's not provided.

This is unlike the `Map` constructor but like `Array.from` and [most other uses of the iteration protocol](https://github.com/tc39/ecma262/pull/1069#issuecomment-360043550). The `Map` constructor is also used to construct new empty `Map`s, whereas this is not the preferred way of constructing new empty objects.

Issue: [#6](https://github.com/bakkot/object-from-entries/issues/6).


### Evaluation order

This proposal chooses to get the value from the entry record before coercing the key with `ToPropertyKey`. This matters because both of these steps are observable.

This is somewhat arbitrary, but is consistent with regular assignment: `({}[{ toString(){ console.log(2); return ''; } }] = console.log(1))` prints `1, 2`.


### Prototype of new object

This proposal does not allow specifying the prototype of the resulting object.

However, `Object.assign(Object.create(proto), Object.fromEntries(entries))` can be used for the same effect (modulo [[Set]] vs [[DefineOwnProperty]] differences).

Issue: [#13](https://github.com/bakkot/object-from-entries/issues/13).


### Non-data properties

This proposal does not allow the creation of non-data properties, for example from a list of key-property descriptor pairs.

However, given such a list, `Object.defineProperties({}, Object.fromEntries(list))` can be used for the same effect.


### Installation of properties on existing object

This proposal does not allow installing properties on an existing object.

However, `Object.assign(obj, Object.fromEntries(entries))` can be used for the same effect (modulo [[Set]] vs [[DefineOwnProperty]] differences).


### [[Set]] vs [[DefineOwnProperty]]

This proposal uses `defineOwnProperty` semantics to install properties on the newly-created object.

This is consistent with `Object.create` and `Array.from`, and avoids triggering setters on `Object.prototype`.

Issue: [#2](https://github.com/bakkot/object-from-entries/issues/2).


### Duplicate keys

This proposal does not explicitly handle duplicate keys, with the result that later occurrences of a given key will take precedence over earlier ones.

This is consistent with the `Map` constructor.


### Mapping function

`Array.from` allows specifying a mapping function; this proposal does not.

The mapping function on `Array.from` is more necessary because of `Array.from`'s use for converting arbitrary iterables to arrays.
