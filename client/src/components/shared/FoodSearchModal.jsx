import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { foodAPI } from '../../api';
import './FoodSearchModal.css';

export default function FoodSearchModal({ isOpen, onClose, onLogSuccess, defaultMealSlot = 'lunch' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Calculate state
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('piece');
  const [calculatedMacros, setCalculatedMacros] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Log state
  const [isLogging, setIsLogging] = useState(false);
  const [mealSlot, setMealSlot] = useState(defaultMealSlot);
  
  const searchTimeoutRef = useRef(null);

  // Focus input on mount
  const inputRef = useRef(null);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedItem(null);
      setCalculatedMacros(null);
      setQuantity(1);
      setUnit('piece');
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await foodAPI.search({ query, limit: 10 });
        setResults(data.results || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [query]);

  // Recalculate macros when quantity/unit change
  useEffect(() => {
    if (!selectedItem) return;

    const calculate = async () => {
      setIsCalculating(true);
      try {
        const { data } = await foodAPI.calculate({
          name: selectedItem.name,
          quantity: parseFloat(quantity) || 1,
          unit: unit
        });
        setCalculatedMacros(data.result);
      } catch (err) {
        console.error('Calculate failed', err);
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce calc slightly to avoid spamming if typing quantity
    const calcTimeout = setTimeout(calculate, 300);
    return () => clearTimeout(calcTimeout);
  }, [selectedItem, quantity, unit]);

  const handleSelect = (item) => {
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
      setCalculatedMacros(null);
      return;
    }
    setSelectedItem(item);
    setQuantity(1);
    // Suggest default unit based on item if we wanted to, but we'll stick to 'piece' or 'serving' for branded
    setUnit(item.type === 'branded' ? 'serving' : 'piece');
  };

  const handleLog = async () => {
    if (!calculatedMacros) return;
    
    setIsLogging(true);
    try {
      await foodAPI.log({
        meal_slot: mealSlot,
        raw_input: `${quantity} ${unit} ${calculatedMacros.food_name}`,
        items: [calculatedMacros],
      });
      onLogSuccess();
      onClose();
    } catch (err) {
      console.error('Logging failed', err);
    } finally {
      setIsLogging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="food-search-modal-backdrop">
      <motion.div 
        className="food-search-modal"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="food-search-modal__header">
          <h2 className="food-search-modal__title">Search Food Database</h2>
          <button className="food-search-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="food-search-modal__search-bar">
          <div className="food-search-modal__input-wrap">
            <Search size={18} className="food-search-modal__input-icon" />
            <input
              ref={inputRef}
              type="text"
              className="food-search-modal__input"
              placeholder="e.g., Paneer butter masala..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="food-search-modal__content">
          {isSearching && results.length === 0 && (
            <div className="food-search-modal__empty">
              <Loader2 size={24} className="diet-v2__feed-spinning food-search-modal__empty-icon" />
              <span>Searching...</span>
            </div>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <div className="food-search-modal__empty">
              <span>No results found for "{query}"</span>
            </div>
          )}

          {!isSearching && query.trim().length < 2 && (
            <div className="food-search-modal__empty">
              <span>Type at least 2 characters to search the verified database.</span>
            </div>
          )}

          <div className="food-search-modal__list">
            {results.map((item) => (
              <div 
                key={item.id} 
                className={`food-search-item ${selectedItem?.id === item.id ? 'food-search-item--selected' : ''}`}
                onClick={() => handleSelect(item)}
              >
                <div className="food-search-item__main">
                  <div className="food-search-item__name">
                    {item.name}
                    {item.name_hi && <span className="food-search-item__sub">{item.name_hi}</span>}
                    {item.type === 'branded' && <span className="food-search-item__sub">🏢 {item.brand}</span>}
                  </div>
                  <div className="food-search-item__cals">
                    {item.type === 'branded' 
                      ? `${item.calories} kcal / serv` 
                      : `${item.calories_100g} kcal / 100g`}
                  </div>
                </div>

                {selectedItem?.id === item.id && (
                  <motion.div 
                    className="food-search-detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="food-search-detail__row">
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1"
                        className="food-search-detail__input" 
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Quantity"
                      />
                      <select 
                        className="food-search-detail__select"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      >
                        {item.type === 'branded' ? (
                          <option value="serving">Serving</option>
                        ) : (
                          <>
                            <option value="piece">Piece</option>
                            <option value="katori">Katori / Bowl</option>
                            <option value="plate">Plate</option>
                            <option value="glass">Glass</option>
                            <option value="cup">Cup</option>
                            <option value="tablespoon">Tablespoon</option>
                            <option value="handful">Handful</option>
                            <option value="gram">Grams (g)</option>
                            <option value="ml">Milliliters (ml)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="food-search-detail__slot">
                      <span className="food-search-detail__slot-label">Meal</span>
                      <select 
                        className="food-search-detail__select"
                        value={mealSlot}
                        onChange={(e) => setMealSlot(e.target.value)}
                      >
                        <option value="morning_chai">Morning Chai</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="evening_snack">Evening Snack</option>
                        <option value="pre_workout">Pre-Workout</option>
                        <option value="post_workout">Post-Workout</option>
                        <option value="dinner">Dinner</option>
                      </select>
                    </div>

                    <div className="food-search-detail__macros">
                      {isCalculating || !calculatedMacros ? (
                        <div style={{ width: '100%', textAlign: 'center', opacity: 0.5 }}>
                          <Loader2 size={16} className="diet-v2__feed-spinning" /> Calculating...
                        </div>
                      ) : (
                        <>
                          <div className="food-search-detail__macro">
                            <span className="food-search-detail__macro-val">{calculatedMacros.calories}</span>
                            <span className="food-search-detail__macro-label">kcal</span>
                          </div>
                          <div className="food-search-detail__macro">
                            <span className="food-search-detail__macro-val">{calculatedMacros.protein}g</span>
                            <span className="food-search-detail__macro-label">Protein</span>
                          </div>
                          <div className="food-search-detail__macro">
                            <span className="food-search-detail__macro-val">{calculatedMacros.carbs}g</span>
                            <span className="food-search-detail__macro-label">Carbs</span>
                          </div>
                          <div className="food-search-detail__macro">
                            <span className="food-search-detail__macro-val">{calculatedMacros.fat}g</span>
                            <span className="food-search-detail__macro-label">Fat</span>
                          </div>
                          <div className="food-search-detail__macro" style={{opacity: 0.7}}>
                            <span className="food-search-detail__macro-val">{calculatedMacros.gram_weight || '-'}</span>
                            <span className="food-search-detail__macro-label">est. grams</span>
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      className="food-search-detail__btn"
                      onClick={handleLog}
                      disabled={isCalculating || !calculatedMacros || isLogging}
                    >
                      {isLogging ? (
                        <><Loader2 size={18} className="diet-v2__feed-spinning"/> Logging...</>
                      ) : (
                        <><CheckCircle2 size={18} /> Log Food</>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
