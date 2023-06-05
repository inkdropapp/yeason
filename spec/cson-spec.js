const path = require('path')
const fs = require('fs-plus')
const temp = require('temp')
const CSON = require('../src/cson')

const readFile = function (filePath, callback) {
  const done = jasmine.createSpy('readFile callback')
  expect(CSON.readFile(filePath, done)).toBeUndefined()
  waitsFor(() => done.callCount === 1)
  return runs(() => callback(...Array.from(done.argsForCall[0] || [])))
}

describe('CSON', function () {
  beforeEach(function () {
    CSON.setCacheDir(null)
    return CSON.resetCacheStats()
  })

  describe('.stringify(object)', function () {
    describe('when the object is undefined', () =>
      it('returns undefined', () =>
        expect(CSON.stringify(undefined)).toBe(undefined)))

    describe('when the object is a function', () =>
      it('returns undefined', () =>
        expect(CSON.stringify(() => 'function')).toBe(undefined)))

    describe('when the object contains a function', () =>
      it('it gets filtered away, when not providing a visitor function', () =>
        expect(
          CSON.stringify({
            a() {
              return 'function'
            }
          })
        ).toBe('{}\n')))

    describe('when formatting an undefined key', () =>
      it('does not include the key in the formatted CSON', () =>
        expect(CSON.stringify({ b: 1, c: undefined })).toBe('b: 1\n')))

    describe('when formatting a string', function () {
      it('returns formatted CSON', () =>
        expect(CSON.stringify({ a: 'b' })).toBe('a: b\n'))

      it("doesn't escape single quotes", () =>
        expect(CSON.stringify({ a: "'b'" })).toBe('a: "\'b\'"\n'))

      it('escapes double quotes', () =>
        expect(CSON.stringify({ a: '"b"' })).toBe('a: \'"b"\'\n'))
    })

    describe('when formatting a boolean', () =>
      it('returns formatted CSON', function () {
        expect(CSON.stringify(true)).toBe('true\n')
        expect(CSON.stringify(false)).toBe('false\n')
        expect(CSON.stringify({ a: true })).toBe('a: true\n')
        return expect(CSON.stringify({ a: false })).toBe('a: false\n')
      }))

    describe('when formatting a number', () =>
      it('returns formatted CSON', function () {
        expect(CSON.stringify(54321.012345)).toBe('54321.012345\n')
        expect(CSON.stringify({ a: 14 })).toBe('a: 14\n')
        return expect(CSON.stringify({ a: 1.23 })).toBe('a: 1.23\n')
      }))

    describe('when formatting null', () =>
      it('returns formatted CSON', function () {
        expect(CSON.stringify(null)).toBe('null\n')
        return expect(CSON.stringify({ a: null })).toBe('a: null\n')
      }))

    describe('when formatting an array', function () {
      describe('when the array is empty', () =>
        it('puts the array on a single line', () =>
          expect(CSON.stringify([])).toBe('[]\n')))

      it('returns formatted CSON', function () {
        expect(CSON.stringify({ a: ['b'] })).toBe(`\
a:
  - b
`)
        return expect(CSON.stringify({ a: ['b', 4] })).toBe(`\
a:
  - b
  - 4
`)
      })

      describe('when the array has an undefined value', () =>
        it('formats the undefined value as null', () =>
          expect(CSON.stringify(['a', undefined, 'b'])).toBe(`- a
- null
- b\n`)))

      return describe('when the array contains an object', () =>
        it('wraps the object in {}', () =>
          expect(CSON.stringify([{ a: 'b', a1: 'b1' }, { c: 'd' }]))
            .toBe(`- a: b
  a1: b1
- c: d\n`)))
    })

    return describe('when formatting an object', function () {
      describe('when the object is empty', () =>
        it('returns {}', () => expect(CSON.stringify({})).toBe('{}\n')))

      it('returns formatted CSON', function () {
        expect(CSON.stringify({ a: { b: 'c' } })).toBe(`\
a:
  b: c
`)
        expect(CSON.stringify({ a: {} })).toBe('a: {}\n')
        return expect(CSON.stringify({ a: [] })).toBe('a: []\n')
      })

      return it('escapes object keys', () =>
        expect(CSON.stringify({ '\\t': 3 })).toBe('\\t: 3\n'))
    })
  })

  describe('.parse', () =>
    it('returns the javascript value', () =>
      expect(CSON.parse('a: "b"')).toEqual({ a: 'b' })))

  describe('.isObjectPath(objectPath)', () =>
    it('returns true if the path has an object extension', function () {
      expect(CSON.isObjectPath('/test2.json')).toBe(true)
      expect(CSON.isObjectPath('/a/b.cson')).toBe(true)
      expect(CSON.isObjectPath()).toBe(false)
      expect(CSON.isObjectPath(null)).toBe(false)
      expect(CSON.isObjectPath('')).toBe(false)
      return expect(CSON.isObjectPath('a/b/c.txt')).toBe(false)
    }))

  describe('.resolve(objectPath)', () =>
    it('returns the path to the object file', function () {
      const objectDir = temp.mkdirSync('season-object-dir-')
      const file1 = path.join(objectDir, 'file1.json')
      const file2 = path.join(objectDir, 'file2.yml')
      const file3 = path.join(objectDir, 'file3.cson')
      const file4 = path.join(objectDir, 'file4.json')
      const folder1 = path.join(objectDir, 'folder1.json')
      fs.mkdirSync(folder1)
      fs.writeFileSync(file1, '{}')
      fs.writeFileSync(file2, '{}')
      fs.writeFileSync(file3, '{}')
      fs.writeFileSync(file4, '{}')

      expect(CSON.resolve(file1)).toBe(file1)
      expect(CSON.resolve(file2)).toBe(file2)
      expect(CSON.resolve(file3)).toBe(file3)
      expect(CSON.resolve(file4)).toBe(file4)
      expect(CSON.resolve(path.join(objectDir, 'file5'))).toBe(null)
      expect(CSON.resolve(folder1)).toBe(null)
      expect(CSON.resolve()).toBe(null)
      expect(CSON.resolve(null)).toBe(null)
      return expect(CSON.resolve('')).toBe(null)
    }))

  describe('.writeFile(objectPath, object, callback)', function () {
    const object = {
      a: 1,
      b: 2
    }

    describe('when called with a .json path', () =>
      it('writes the object and calls back', function () {
        const jsonPath = path.join(
          temp.mkdirSync('season-object-dir-'),
          'file1.json'
        )
        const callback = jasmine.createSpy('callback')
        CSON.writeFile(jsonPath, object, callback)

        waitsFor(() => callback.callCount === 1)

        return runs(() => expect(CSON.readFileSync(jsonPath)).toEqual(object))
      }))

    describe('when called with a .yml path', function () {
      const yamlPath = path.join(
        temp.mkdirSync('season-object-dir-'),
        'file1.yml'
      )

      return it('writes the object and calls back', function () {
        const callback = jasmine.createSpy('callback')
        CSON.writeFile(yamlPath, object, callback)

        waitsFor(() => callback.callCount === 1)

        return runs(() => expect(CSON.readFileSync(yamlPath)).toEqual(object))
      })
    })

    return describe('when called with a .cson path', function () {
      const csonPath = path.join(
        temp.mkdirSync('season-object-dir-'),
        'file1.cson'
      )

      return it('writes the object and calls back', function () {
        const callback = jasmine.createSpy('callback')
        CSON.writeFile(csonPath, object, callback)

        waitsFor(() => callback.callCount === 1)

        return runs(() => expect(CSON.readFileSync(csonPath)).toEqual(object))
      })
    })
  })

  describe('readFileSync', function () {
    it('returns null for files that are all whitespace', function () {
      expect(
        CSON.readFileSync(path.join(__dirname, 'fixtures', 'empty.cson'))
      ).toBeNull()
      expect(
        CSON.readFileSync(path.join(__dirname, 'fixtures', 'empty.json'))
      ).toBeNull()
      expect(
        CSON.readFileSync(path.join(__dirname, 'fixtures', 'empty-line.cson'))
      ).toBeNull()
      return expect(
        CSON.readFileSync(path.join(__dirname, 'fixtures', 'empty-line.json'))
      ).toBeNull()
    })

    it('throws errors for invalid .cson files', function () {
      const errorPath = path.join(__dirname, 'fixtures', 'syntax-error.cson')
      let parseError = null

      try {
        CSON.readFileSync(errorPath)
      } catch (error) {
        parseError = error
      }

      expect(parseError.path).toBe(errorPath)
      expect(parseError.filename).toBe(errorPath)
      return expect(parseError.code).toBe('UNEXPECTED_TOKEN')
    })

    it('throws errors for invalid .json files', function () {
      const errorPath = path.join(__dirname, 'fixtures', 'syntax-error.json')
      let parseError = null

      try {
        CSON.readFileSync(errorPath)
      } catch (error) {
        parseError = error
      }

      expect(parseError.path).toBe(errorPath)
      return expect(parseError.filename).toBe(errorPath)
    })

    it('does not increment the cache stats when .json files are read', function () {
      expect(CSON.getCacheHits()).toBe(0)
      expect(CSON.getCacheMisses()).toBe(0)
      CSON.readFileSync(path.join(__dirname, 'fixtures', 'sample.json'))
      expect(CSON.getCacheHits()).toBe(0)
      return expect(CSON.getCacheMisses()).toBe(0)
    })

    return describe('when the allowDuplicateKeys option is set to false', () =>
      it('throws errors if objects contain duplicate keys', function () {
        expect(() =>
          CSON.readFileSync(
            path.join(__dirname, 'fixtures', 'duplicate-keys.cson'),
            { allowDuplicateKeys: false }
          )
        ).toThrow(`Map keys must be unique at line 3, column 1:

bar: 2
foo: 3
^
`)

        expect(
          CSON.readFileSync(path.join(__dirname, 'fixtures', 'sample.cson'), {
            allowDuplicateKeys: false
          })
        ).toEqual({
          a: 1,
          b: { c: true }
        })

        return expect(
          CSON.readFileSync(
            path.join(__dirname, 'fixtures', 'duplicate-keys.cson')
          )
        ).toEqual({
          foo: 3,
          bar: 2
        })
      }))
  })

  describe('readFile', function () {
    it('calls back with null for files that are all whitespace', function () {
      const callback = function (error, content) {
        expect(error).toBeNull()
        return expect(content).toBeNull()
      }

      readFile(path.join(__dirname, 'fixtures', 'empty.cson'), callback)
      readFile(path.join(__dirname, 'fixtures', 'empty.json'), callback)
      readFile(path.join(__dirname, 'fixtures', 'empty-line.cson'), callback)
      return readFile(
        path.join(__dirname, 'fixtures', 'empty-line.json'),
        callback
      )
    })

    it('calls back with an error for files that do no exist', function () {
      const callback = function (error, content) {
        expect(error).not.toBeNull()
        return expect(content).toBeUndefined()
      }

      readFile(
        path.join(__dirname, 'fixtures', 'this-file-does-not-exist.cson'),
        callback
      )
      return readFile(
        path.join(__dirname, 'fixtures', 'this-file-does-not-exist.json'),
        callback
      )
    })

    it('calls back with null for files that are all comments', function () {
      const callback = function (error, content) {
        expect(error).toBeNull()
        return expect(content).toBeNull()
      }

      readFile(
        path.join(__dirname, 'fixtures', 'single-comment.cson'),
        callback
      )
      return readFile(
        path.join(__dirname, 'fixtures', 'multi-comment.cson'),
        callback
      )
    })

    it('calls back with an error for invalid files', function () {
      let done = false

      const callback = function (error, content) {
        done = true
        expect(error).not.toBeNull()
        expect(error.path).toEqual(
          path.join(__dirname, 'fixtures', 'invalid.cson')
        )
        expect(error.message).toContain(
          path.join(__dirname, 'fixtures', 'invalid.cson')
        )
        return expect(content).toBeUndefined()
      }

      readFile(path.join(__dirname, 'fixtures', 'invalid.cson'), callback)

      return waitsFor(() => done)
    })

    it('calls back with location information for .cson files with syntax errors', function () {
      let done = false
      const errorPath = path.join(__dirname, 'fixtures', 'syntax-error.cson')

      const callback = function (parseError, content) {
        done = true
        expect(parseError.path).toBe(errorPath)
        expect(parseError.filename).toBe(errorPath)
        return expect(parseError.code).toBe('UNEXPECTED_TOKEN')
      }

      readFile(errorPath, callback)

      return waitsFor(() => done)
    })

    it('calls back with path information for .json files with syntax errors', function () {
      let done = false
      const errorPath = path.join(__dirname, 'fixtures', 'syntax-error.json')

      const callback = function (parseError, content) {
        done = true
        expect(parseError.path).toBe(errorPath)
        return expect(parseError.filename).toBe(errorPath)
      }

      readFile(errorPath, callback)

      return waitsFor(() => done)
    })

    describe('when the allowDuplicateKeys option is set to false', () =>
      it('calls back with an error if objects contain duplicate keys', function () {
        const fixturePath = path.join(
          __dirname,
          'fixtures',
          'duplicate-keys.cson'
        )
        let done = false

        runs(() =>
          CSON.readFile(
            fixturePath,
            { allowDuplicateKeys: false },
            function (err, content) {
              expect(err.message).toContain('Map keys must be unique at line')
              expect(content).toBeUndefined()
              return (done = true)
            }
          )
        )

        waitsFor(() => done)

        runs(function () {
          done = false
          return CSON.readFile(fixturePath, function (err, content) {
            expect(content).toEqual({
              foo: 3,
              bar: 2
            })
            return (done = true)
          })
        })

        return waitsFor(() => done)
      }))

    return describe('when an error is thrown by the callback', function () {
      let uncaughtListeners = null

      beforeEach(function () {
        uncaughtListeners = process.listeners('uncaughtException')
        return process.removeAllListeners('uncaughtException')
      })

      afterEach(() =>
        Array.from(uncaughtListeners).map(listener =>
          process.on('uncaughtException', listener)
        )
      )

      return it('only calls the callback once when it throws an error', function () {
        let called = 0
        const callback = function () {
          called++
          throw new Error('called')
        }

        const uncaughtHandler = jasmine.createSpy('uncaughtHandler')
        process.once('uncaughtException', uncaughtHandler)

        CSON.readFile(path.join(__dirname, 'fixtures', 'sample.cson'), callback)

        waitsFor(() => called > 0)

        return runs(function () {
          expect(called).toBe(1)
          return expect(uncaughtHandler.callCount).toBe(1)
        })
      })
    })
  })
})
