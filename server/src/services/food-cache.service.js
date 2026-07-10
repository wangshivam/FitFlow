/**
 * Indian Food Cache Service
 * In-memory cache loaded from database on startup.
 * Provides fuzzy matching for fast food lookups before hitting Claude API.
 */

import db from '../db/connection.js';

class FoodCacheService {
  constructor() {
    this.cache = new Map();       // food_name → food data
    this.aliasMap = new Map();    // alias → food_name
    this.loaded = false;
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Load cache from database
   */
  async initialize() {
    if (this.loaded) return;
    try {
      const foods = await db('indian_food_cache').select('*');
      for (const food of foods) {
        const key = food.food_name.toLowerCase().trim();
        this.cache.set(key, food);

        // Parse and register aliases
        let aliases = [];
        try {
          aliases = typeof food.aliases === 'string' ? JSON.parse(food.aliases) : (food.aliases || []);
        } catch {
          aliases = [];
        }
        for (const alias of aliases) {
          this.aliasMap.set(alias.toLowerCase().trim(), key);
        }
      }
      this.loaded = true;
      console.log(`📦 Food cache loaded: ${this.cache.size} items, ${this.aliasMap.size} aliases`);
    } catch (err) {
      // DB might not be set up yet — fail silently and retry later
      console.warn('⚠️ Food cache init skipped (DB not ready):', err.message);
    }
  }

  /**
   * Look up a food item by name with fuzzy matching
   * Returns: { found: boolean, food: object|null, confidence: number, matchType: string }
   */
  lookup(rawName) {
    if (!this.loaded || !rawName) {
      this.stats.misses++;
      return { found: false, food: null, confidence: 0, matchType: 'none' };
    }

    const name = rawName.toLowerCase().trim();

    // 1. Exact match
    if (this.cache.has(name)) {
      this.stats.hits++;
      return {
        found: true,
        food: this.cache.get(name),
        confidence: this.cache.get(name).confidence || 0.97,
        matchType: 'exact',
      };
    }

    // 2. Alias match
    if (this.aliasMap.has(name)) {
      const primaryKey = this.aliasMap.get(name);
      this.stats.hits++;
      return {
        found: true,
        food: this.cache.get(primaryKey),
        confidence: (this.cache.get(primaryKey)?.confidence || 0.95) * 0.98,
        matchType: 'alias',
      };
    }

    // 3. Partial match — check if query is a substring of any cached name/alias
    for (const [key, food] of this.cache) {
      if (key.includes(name) || name.includes(key)) {
        this.stats.hits++;
        return {
          found: true,
          food,
          confidence: (food.confidence || 0.90) * 0.85,
          matchType: 'partial',
        };
      }
    }

    // 4. Alias partial match
    for (const [alias, primaryKey] of this.aliasMap) {
      if (alias.includes(name) || name.includes(alias)) {
        this.stats.hits++;
        return {
          found: true,
          food: this.cache.get(primaryKey),
          confidence: (this.cache.get(primaryKey)?.confidence || 0.85) * 0.80,
          matchType: 'partial_alias',
        };
      }
    }

    this.stats.misses++;
    return { found: false, food: null, confidence: 0, matchType: 'none' };
  }

  /**
   * Convert a cached food item to the parsed food item format
   */
  toParsedItem(cacheResult, quantity = null, unit = null) {
    const food = cacheResult.food;
    const qty = quantity || food.default_quantity || 1;
    const foodUnit = unit || food.default_unit || 'piece';
    const multiplier = qty / (food.default_quantity || 1);

    return {
      food_name: food.food_name,
      food_name_hi: food.food_name_hi || '',
      quantity: qty,
      unit: foodUnit,
      calories: Math.round(food.calories_per_serving * multiplier),
      protein: parseFloat((food.protein_per_serving * multiplier).toFixed(1)),
      carbs: parseFloat((food.carbs_per_serving * multiplier).toFixed(1)),
      fat: parseFloat((food.fat_per_serving * multiplier).toFixed(1)),
      fibre: parseFloat(((food.fibre_per_serving || 0) * multiplier).toFixed(1)),
      sugar: parseFloat(((food.sugar_per_serving || 0) * multiplier).toFixed(1)),
      sodium: parseFloat(((food.sodium_per_serving || 0) * multiplier).toFixed(1)),
      confidence: cacheResult.confidence,
      from_cache: true,
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%',
      cacheSize: this.cache.size,
      aliasCount: this.aliasMap.size,
    };
  }
}

// Singleton
const foodCacheService = new FoodCacheService();
export default foodCacheService;
