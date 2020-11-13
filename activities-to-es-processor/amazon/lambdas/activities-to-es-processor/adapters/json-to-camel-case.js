function parseJsonToCamelCase(json) {
  const obj = JSON.parse(json);
  return toCamel(obj);
}

//TODO Refactor the recursion
function toCamel(o) {
  if (o instanceof Array) {
    return o.map(value => typeof value === "object" ? toCamel(value) : value);
  } 

  const newO = {}
  for (let origKey in o) {
    if (o.hasOwnProperty(origKey)) {
      const newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString()
      let value = o[origKey]
      if (value instanceof Array || (value !== null && value.constructor === Object)) {
        value = toCamel(value)
      }
      newO[newKey] = value
    }
  }
  return newO;
}

module.exports = parseJsonToCamelCase;