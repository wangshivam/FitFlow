/**
 * Core Nutrition Service
 * Interacts with the normalized nutrition database for searching, 
 * fuzzy matching, and precise macro calculations.
 */

import db from '../db/connection.js';

class NutritionService {
  /**
   * Search for food items using fuzzy text matching (pg_trgm).
   * Searches both canonical foods and branded foods.
   */
  async search(query, limit = 10) {
    if (!query || query.trim().length < 2) return [];

    const safeQuery = query.trim();

    try {
      // 1. Search Canonical Foods & Aliases
      // We use ILIKE '%query%' as a fallback or strict matching, 
      // but ideally pg_trgm similarity works beautifully here.
      const foods = await db('foods as f')
        .leftJoin('food_aliases as fa', 'f.id', 'fa.food_id')
        .leftJoin('food_categories as c', 'f.category_id', 'c.id')
        .select(
          'f.id as base_id',
          'f.canonical_name as name',
          'f.canonical_name_hi as name_hi',
          'c.name as category',
          'f.calories_per_100g as calories_100g',
          'f.protein_per_100g as protein_100g',
          'f.carbs_per_100g as carbs_100g',
          'f.fat_per_100g as fat_100g',
          db.raw(`
            GREATEST(
              similarity(f.canonical_name, ?),
              COALESCE(MAX(similarity(fa.alias_name, ?)), 0)
            ) as match_score
          `, [safeQuery, safeQuery])
        )
        .groupBy('f.id', 'c.name')
        .orderBy('match_score', 'desc')
        .limit(limit);

      // 2. Search Branded Foods
      const branded = await db('branded_foods as b')
        .select(
          'b.id as branded_id',
          'b.brand_name',
          'b.item_name as name',
          'b.calories_per_serving',
          'b.protein_per_serving',
          'b.carbs_per_serving',
          'b.fat_per_serving',
          'b.serving_size_grams',
          db.raw(`similarity(CONCAT(b.brand_name, ' ', b.item_name), ?) as match_score`, [safeQuery])
        )
        .orderBy('match_score', 'desc')
        .limit(limit);

      // Merge and sort
      const combined = [...foods, ...branded]
        .filter(item => item.match_score > 0.15) // minimum threshold
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, limit);

      return combined.map(item => this._formatSearchResult(item));
    } catch (error) {
      console.error('Nutrition search error:', error);
      return [];
    }
  }

  /**
   * Find the absolute best match for an exact (or highly similar) parsed string.
   */
  async match(parsedName) {
    if (!parsedName) return null;
    const query = parsedName.toLowerCase().trim();

    // Strategy 1: Exact match on canonical_name
    let result = await db('foods').whereRaw('LOWER(canonical_name) = ?', [query]).first();
    
    // Strategy 2: Exact match on alias
    if (!result) {
      const aliasMatch = await db('food_aliases as fa')
        .join('foods as f', 'fa.food_id', 'f.id')
        .whereRaw('LOWER(fa.alias_name) = ?', [query])
        .select('f.*')
        .first();
      if (aliasMatch) result = aliasMatch;
    }

    // Strategy 3: Top result from fuzzy search if score is very high (>0.6)
    if (!result) {
      const topFuzzy = (await this.search(query, 1))[0];
      if (topFuzzy && topFuzzy._rawScore > 0.6 && topFuzzy.type === 'canonical') {
        result = await db('foods').where({ id: topFuzzy.id }).first();
      } else if (topFuzzy && topFuzzy._rawScore > 0.6 && topFuzzy.type === 'branded') {
        // Return branded item directly
        return await db('branded_foods').where({ id: topFuzzy.id }).first();
      }
    }

    return result || null;
  }

  /**
   * Calculate precise macros given a food item, quantity, and unit.
   */
  async calculate(foodName, quantity = 1, unit = 'piece') {
    const qty = parseFloat(quantity) || 1;
    let safeUnit = (unit || 'piece').toLowerCase().trim();

    const match = await this.match(foodName);
    if (!match) {
      return null; // Not found in DB
    }

    let gramWeight = 100; // Default base for calculations if unit is unknown
    let confidence = match.confidence || 0.90;

    // Handle Branded Food (it has exact serving values)
    if (match.brand_name) {
      const multiplier = qty; // Branded items are always "per 1 item" implicitly unless specified
      return {
        food_name: `${match.brand_name} ${match.item_name}`,
        food_name_hi: '',
        quantity: qty,
        unit: 'serving',
        calories: Math.round(match.calories_per_serving * multiplier),
        protein: parseFloat((match.protein_per_serving * multiplier).toFixed(1)),
        carbs: parseFloat((match.carbs_per_serving * multiplier).toFixed(1)),
        fat: parseFloat((match.fat_per_serving * multiplier).toFixed(1)),
        fibre: 0,
        sugar: 0,
        sodium: 0,
        confidence: 0.98,
        source: 'branded',
      };
    }

    // Handle Canonical Food
    // 1. Check if unit is standard metric
    if (['g', 'gram', 'grams', 'ml'].includes(safeUnit)) {
      gramWeight = qty;
    } else if (['kg', 'liter', 'litre'].includes(safeUnit)) {
      gramWeight = qty * 1000;
    } else {
      // 2. Lookup standard serving conversion in DB
      const serving = await db('food_servings')
        .where({ food_id: match.id, unit_name: safeUnit })
        .first();

      if (serving) {
        gramWeight = serving.gram_weight * qty;
      } else {
        // 3. Fallback to default serving if specific unit not found
        const defaultServing = await db('food_servings')
          .where({ food_id: match.id, is_default: true })
          .first();
        
        if (defaultServing) {
          gramWeight = defaultServing.gram_weight * qty;
          safeUnit = defaultServing.unit_name;
          confidence *= 0.8; // Lower confidence because we substituted the unit
        } else {
          // Absolute fallback
          gramWeight = 100 * qty; 
          confidence *= 0.6;
        }
      }
    }

    // Calculate final macros based on (gramWeight / 100) * per_100g_value
    const multiplier = gramWeight / 100;

    return {
      food_name: match.canonical_name,
      food_name_hi: match.canonical_name_hi || '',
      quantity: qty,
      unit: safeUnit,
      gram_weight: Math.round(gramWeight),
      calories: Math.round(match.calories_per_100g * multiplier),
      protein: parseFloat((match.protein_per_100g * multiplier).toFixed(1)),
      carbs: parseFloat((match.carbs_per_100g * multiplier).toFixed(1)),
      fat: parseFloat((match.fat_per_100g * multiplier).toFixed(1)),
      fibre: parseFloat(((match.fibre_per_100g || 0) * multiplier).toFixed(1)),
      sugar: parseFloat(((match.sugar_per_100g || 0) * multiplier).toFixed(1)),
      sodium: parseFloat(((match.sodium_per_100g || 0) * multiplier).toFixed(1)),
      confidence: parseFloat(confidence.toFixed(2)),
      source: match.source || 'db',
    };
  }

  // --- Internals ---

  _formatSearchResult(item) {
    if (item.branded_id) {
      return {
        id: item.branded_id,
        type: 'branded',
        name: `${item.brand_name} ${item.name}`,
        brand: item.brand_name,
        calories: item.calories_per_serving,
        protein: item.protein_per_serving,
        carbs: item.carbs_per_serving,
        fat: item.fat_per_serving,
        _rawScore: item.match_score,
      };
    }

    return {
      id: item.base_id,
      type: 'canonical',
      name: item.name,
      name_hi: item.name_hi,
      category: item.category,
      calories_100g: item.calories_100g,
      protein_100g: item.protein_100g,
      carbs_100g: item.carbs_100g,
      fat_100g: item.fat_100g,
      _rawScore: item.match_score,
    };
  }
}

export default new NutritionService();
