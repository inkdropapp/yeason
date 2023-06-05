const YAML = require('yaml')
const { cson2yaml } = require('@inkdropapp/cson-to-yaml')

exports.parse = (contents, options) => {
  const yaml = cson2yaml(contents)
  return YAML.parse(yaml, options)
}

exports.stringify = object => {
  if (typeof object === 'undefined' || typeof object === 'function')
    return undefined
  const replacer = (key, value) => {
    if (typeof value === 'function') return undefined
    return value
  }
  return YAML.stringify(object, replacer, { singleQuote: true })
}
