if (!('fromEntries' in Object)) {
  Object.fromEntries = iter => {
    if (iter == null) {
      return {};
    }

    const pairs = [ ...iter ]; // calls GetIterator (Array.from would coerce)

    const obj = {};

    for (const [ index, pair ] of pairs.entries()) {
      if (!pair || typeof pair !== 'object') {
        throw new TypeError(`Iterator value ${ index } is not an entry object`);
      }

      const { 0: key, 1: val } = pair;

      if (typeof key !== 'string') {
        throw new TypeError(`Entry object key must be a string`);
      }

      obj[key] = val;
    }

    return obj;
  };
}
