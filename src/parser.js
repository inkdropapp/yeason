exports.parse = (contents, options) => {
  const YAML = require('yaml')
  const { cson2yaml } = require('@inkdropapp/cson-to-yaml')
  const yaml = cson2yaml(contents)
  return YAML.parse(yaml, options)
}

exports.stringify = object => {
  const YAML = require('yaml')
  if (typeof object === 'undefined' || typeof object === 'function')
    return undefined
  const replacer = (key, value) => {
    if (typeof value === 'function') return undefined
    return value
  }
  return YAML.stringify(object, replacer, { singleQuote: true })
}
