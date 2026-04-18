import {
  isPincodeAllowed,
  calculateCartTotal,
  sanitizeTakeawayDiscountSettings,
  DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS,
} from '@/lib/checkout'
import { mockPricedCartItems, mockPincode, mockInvalidPincode } from './mocks'

describe('checkout utilities', () => {
  describe('isPincodeAllowed', () => {
    it('should return true for allowed pincodes', () => {
      expect(isPincodeAllowed(mockPincode)).toBe(true)
      expect(isPincodeAllowed('75002')).toBe(true)
      expect(isPincodeAllowed('75003')).toBe(true)
    })

    it('should return false for disallowed pincodes', () => {
      expect(isPincodeAllowed(mockInvalidPincode)).toBe(false)
      expect(isPincodeAllowed('99999')).toBe(false)
    })

    it('should handle whitespace', () => {
      expect(isPincodeAllowed(` ${mockPincode} `)).toBe(true)
      expect(isPincodeAllowed(`${mockPincode} `)).toBe(true)
    })
  })

  describe('calculateCartTotal', () => {
    it('should calculate total for single item', () => {
      const items = [{ price: 10, quantity: 1 }]
      expect(calculateCartTotal(items)).toBe(10)
    })

    it('should calculate total for multiple items', () => {
      expect(calculateCartTotal(mockPricedCartItems)).toBe(55) // (10*1) + (15*2) + (5*3)
    })

    it('should default quantity to 1', () => {
      const items = [{ price: 10 }]
      expect(calculateCartTotal(items)).toBe(10)
    })
  })

  describe('sanitizeTakeawayDiscountSettings', () => {
    it('should return default settings when no settings provided', () => {
      const result = sanitizeTakeawayDiscountSettings()
      expect(result).toEqual(DEFAULT_TAKEAWAY_DISCOUNT_SETTINGS)
    })

    it('should sanitize percentage to valid range', () => {
      expect(sanitizeTakeawayDiscountSettings({ percentage: 150 }).percentage).toBe(100)
      expect(sanitizeTakeawayDiscountSettings({ percentage: -10 }).percentage).toBe(0)
      expect(sanitizeTakeawayDiscountSettings({ percentage: 25.5 }).percentage).toBe(25.5)
    })

    it('should normalize excluded arrays', () => {
      const result = sanitizeTakeawayDiscountSettings({
        excludedDishIds: ['  id1  ', 'id2', ''],
        excludedCategoryNames: ['  cat1  ', 'cat2', ''],
      })
      expect(result.excludedDishIds).toEqual(['id1', 'id2'])
      expect(result.excludedCategoryNames).toEqual(['cat1', 'cat2'])
    })
  })
})