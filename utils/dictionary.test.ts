import { isValidWord, loadCustomDictionary, getDictionarySize } from './dictionary'

describe('dictionary', () => {
  describe('isValidWord', () => {
    it('should validate common 2-letter words', () => {
      expect(isValidWord('is')).toBe(true)
      expect(isValidWord('IS')).toBe(true)
      expect(isValidWord('at')).toBe(true)
      expect(isValidWord('qi')).toBe(true)
    })

    it('should validate common 3-letter words', () => {
      expect(isValidWord('cat')).toBe(true)
      expect(isValidWord('dog')).toBe(true)
      expect(isValidWord('the')).toBe(true)
    })

    it('should validate longer words', () => {
      expect(isValidWord('spell')).toBe(true)
      expect(isValidWord('wibble')).toBe(true)
      expect(isValidWord('score')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isValidWord('CAT')).toBe(true)
      expect(isValidWord('cat')).toBe(true)
      expect(isValidWord('CaT')).toBe(true)
    })

    it('should reject invalid words', () => {
      expect(isValidWord('xyz')).toBe(false)
      expect(isValidWord('zzz')).toBe(false)
      expect(isValidWord('asdfg')).toBe(false)
    })

    it('should reject single letter words', () => {
      expect(isValidWord('a')).toBe(false)
      expect(isValidWord('i')).toBe(false)
      expect(isValidWord('z')).toBe(false)
    })

    it('should reject empty strings', () => {
      expect(isValidWord('')).toBe(false)
    })
  })

  describe('loadCustomDictionary', () => {
    it('should add custom words to dictionary', () => {
      const initialSize = getDictionarySize()
      loadCustomDictionary(['CUSTOM', 'WORDS', 'TEST'])

      expect(isValidWord('custom')).toBe(true)
      expect(isValidWord('words')).toBe(true)
      expect(isValidWord('test')).toBe(true)
      expect(getDictionarySize()).toBeGreaterThan(initialSize)
    })
  })

  describe('getDictionarySize', () => {
    it('should return a positive number', () => {
      expect(getDictionarySize()).toBeGreaterThan(0)
    })
  })
})
