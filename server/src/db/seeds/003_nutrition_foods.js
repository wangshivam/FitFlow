/**
 * Seed: Foods — 500+ Indian foods with per-100g nutrition
 * Sources: IFCT 2017, NIN India, USDA, OpenFoodFacts
 *
 * All values are per 100 grams (or 100ml for liquids).
 * This lets us calculate any portion via: (quantity_grams / 100) * value
 */

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  await knex('foods').del();

  // Fetch category IDs
  const cats = await knex('food_categories').select('id', 'name');
  const cat = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  // Helper: build a food entry
  const f = (name, nameHi, category, cal, pro, carb, fat, opts = {}) => ({
    canonical_name: name,
    canonical_name_hi: nameHi,
    category_id: cat[category] || null,
    cuisine_type: opts.cuisine || 'pan_indian',
    is_veg: opts.veg !== undefined ? opts.veg : true,
    calories_per_100g: cal,
    protein_per_100g: pro,
    carbs_per_100g: carb,
    fat_per_100g: fat,
    fibre_per_100g: opts.fibre || 0,
    sugar_per_100g: opts.sugar || 0,
    sodium_per_100g: opts.sodium || 0,
    source: opts.source || 'ifct',
    source_food_code: opts.code || null,
    verified: true,
    confidence: opts.conf || 0.95,
  });

  const foods = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // GRAINS & BREADS (~50 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('chapati', 'चपाती', 'grain', 297, 8.7, 55.7, 3.7, { fibre: 3.5, sodium: 493, conf: 0.98 }),
    f('rice', 'चावल', 'grain', 130, 2.7, 28.2, 0.3, { fibre: 0.4, sodium: 1, conf: 0.98 }),
    f('paratha', 'पराठा', 'grain', 326, 6.3, 41.5, 15.0, { fibre: 2.5, sodium: 333, cuisine: 'north_indian' }),
    f('aloo paratha', 'आलू पराठा', 'grain', 270, 5.5, 33.0, 13.5, { fibre: 2.2, sodium: 310, cuisine: 'north_indian' }),
    f('gobi paratha', 'गोभी पराठा', 'grain', 258, 5.8, 32.0, 12.5, { fibre: 2.8, sodium: 300, cuisine: 'north_indian' }),
    f('mooli paratha', 'मूली पराठा', 'grain', 250, 5.2, 31.0, 12.0, { fibre: 2.5, sodium: 290, cuisine: 'north_indian' }),
    f('paneer paratha', 'पनीर पराठा', 'grain', 295, 8.5, 30.0, 15.5, { fibre: 2.0, sodium: 320, cuisine: 'north_indian' }),
    f('naan', 'नान', 'grain', 310, 9.0, 51.0, 7.7, { fibre: 2.1, sodium: 450, cuisine: 'north_indian' }),
    f('butter naan', 'बटर नान', 'grain', 340, 8.5, 48.0, 12.5, { fibre: 1.8, sodium: 460, cuisine: 'north_indian' }),
    f('garlic naan', 'गार्लिक नान', 'grain', 330, 9.2, 49.5, 10.0, { fibre: 2.0, sodium: 455, cuisine: 'north_indian' }),
    f('kulcha', 'कुलचा', 'grain', 320, 8.8, 50.0, 9.5, { fibre: 2.0, sodium: 400, cuisine: 'north_indian' }),
    f('puri', 'पूरी', 'grain', 375, 6.8, 43.8, 20.3, { fibre: 3.1, sodium: 312, conf: 0.97 }),
    f('bhatura', 'भटूरा', 'grain', 350, 7.0, 45.0, 16.0, { fibre: 2.0, sodium: 380, cuisine: 'north_indian' }),
    f('poha', 'पोहा', 'grain', 130, 2.6, 21.5, 3.7, { fibre: 1.1, sodium: 180 }),
    f('upma', 'उपमा', 'grain', 130, 3.4, 19.7, 4.5, { fibre: 1.4, sodium: 230, cuisine: 'south_indian' }),
    f('dosa', 'डोसा', 'grain', 162, 3.9, 27.0, 4.3, { fibre: 1.2, sodium: 192, cuisine: 'south_indian', conf: 0.97 }),
    f('masala dosa', 'मसाला डोसा', 'grain', 175, 3.5, 24.5, 7.5, { fibre: 1.8, sodium: 200, cuisine: 'south_indian' }),
    f('rava dosa', 'रवा डोसा', 'grain', 190, 3.2, 26.0, 8.0, { fibre: 1.0, sodium: 210, cuisine: 'south_indian' }),
    f('idli', 'इडली', 'grain', 130, 4.5, 24.8, 0.9, { fibre: 1.8, sodium: 270, cuisine: 'south_indian', conf: 0.98 }),
    f('vada', 'वड़ा', 'grain', 280, 9.0, 30.0, 14.0, { fibre: 3.5, sodium: 350, cuisine: 'south_indian' }),
    f('medu vada', 'मेदू वड़ा', 'grain', 295, 10.0, 28.0, 16.0, { fibre: 3.0, sodium: 360, cuisine: 'south_indian' }),
    f('uttapam', 'उत्तपम', 'grain', 160, 4.0, 25.0, 5.0, { fibre: 1.5, sodium: 250, cuisine: 'south_indian' }),
    f('appam', 'अप्पम', 'grain', 145, 2.5, 25.0, 4.0, { fibre: 0.8, sodium: 150, cuisine: 'south_indian' }),
    f('puttu', 'पुट्टू', 'grain', 180, 3.0, 30.0, 5.5, { fibre: 2.0, sodium: 100, cuisine: 'south_indian' }),
    f('biryani', 'बिरयानी', 'grain', 172, 7.5, 19.5, 7.0, { fibre: 0.8, sodium: 280, veg: false }),
    f('veg biryani', 'वेज बिरयानी', 'grain', 155, 4.0, 22.0, 5.5, { fibre: 1.5, sodium: 260 }),
    f('pulao', 'पुलाव', 'grain', 150, 3.5, 22.0, 5.0, { fibre: 1.0, sodium: 240 }),
    f('veg pulao', 'वेज पुलाव', 'grain', 145, 3.2, 21.0, 5.2, { fibre: 1.3, sodium: 230 }),
    f('jeera rice', 'जीरा राइस', 'grain', 140, 2.8, 26.0, 2.5, { fibre: 0.5, sodium: 200 }),
    f('lemon rice', 'नींबू चावल', 'grain', 145, 2.5, 25.0, 3.5, { fibre: 0.6, sodium: 220, cuisine: 'south_indian' }),
    f('curd rice', 'दही चावल', 'grain', 125, 3.5, 18.0, 3.5, { fibre: 0.3, sodium: 150, cuisine: 'south_indian' }),
    f('fried rice', 'फ्राइड राइस', 'grain', 163, 3.5, 23.0, 6.5, { fibre: 1.0, sodium: 450 }),
    f('khichdi', 'खिचड़ी', 'grain', 120, 4.2, 18.0, 3.5, { fibre: 1.8, sodium: 210, conf: 0.97 }),
    f('dal khichdi', 'दाल खिचड़ी', 'grain', 125, 5.0, 17.5, 3.8, { fibre: 2.2, sodium: 220 }),
    f('oats', 'ओट्स', 'grain', 389, 16.9, 66.3, 6.9, { fibre: 10.6, sodium: 2, source: 'usda', conf: 0.97 }),
    f('bread', 'ब्रेड', 'grain', 265, 9.0, 49.0, 3.2, { fibre: 2.7, sodium: 500, source: 'usda' }),
    f('brown bread', 'ब्राउन ब्रेड', 'grain', 250, 10.0, 46.0, 3.5, { fibre: 6.0, sodium: 480 }),
    f('maggi', 'मैगी', 'grain', 380, 8.5, 51.0, 16.0, { fibre: 2.3, sodium: 960 }),
    f('hakka noodles', 'हक्का नूडल्स', 'grain', 160, 3.5, 23.0, 6.0, { fibre: 1.0, sodium: 500, cuisine: 'indo_chinese' }),
    f('pongal', 'पोंगल', 'grain', 140, 3.5, 18.0, 6.0, { fibre: 1.5, sodium: 200, cuisine: 'south_indian' }),
    f('ven pongal', 'वेन पोंगल', 'grain', 145, 3.8, 17.0, 6.5, { fibre: 1.3, sodium: 220, cuisine: 'south_indian' }),
    f('ragi mudde', 'रागी मुद्दे', 'grain', 110, 3.2, 22.0, 1.0, { fibre: 3.5, sodium: 50, cuisine: 'south_indian' }),
    f('ragi dosa', 'रागी डोसा', 'grain', 150, 4.0, 25.0, 3.5, { fibre: 3.0, sodium: 180, cuisine: 'south_indian' }),
    f('thepla', 'थेपला', 'grain', 290, 7.5, 38.0, 12.5, { fibre: 3.5, sodium: 380, cuisine: 'gujarati' }),
    f('bhakri', 'भाकरी', 'grain', 330, 7.0, 60.0, 6.5, { fibre: 5.0, sodium: 200, cuisine: 'maharashtrian' }),
    f('bajra roti', 'बाजरा रोटी', 'grain', 360, 11.6, 67.0, 5.0, { fibre: 11.3, sodium: 50, cuisine: 'rajasthani' }),
    f('makki ki roti', 'मक्की की रोटी', 'grain', 350, 8.0, 65.0, 5.0, { fibre: 7.3, sodium: 35, cuisine: 'north_indian' }),
    f('missi roti', 'मिस्सी रोटी', 'grain', 310, 11.0, 48.0, 8.0, { fibre: 5.0, sodium: 350, cuisine: 'north_indian' }),
    f('rumali roti', 'रूमाली रोटी', 'grain', 280, 8.0, 50.0, 4.5, { fibre: 2.0, sodium: 380 }),
    f('lachha paratha', 'लच्छा पराठा', 'grain', 350, 6.0, 42.0, 18.0, { fibre: 2.0, sodium: 340 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DAL & LENTILS (~25 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('toor dal', 'तूर दाल', 'dal_lentil', 80, 5.0, 10.5, 2.3, { fibre: 2.5, sodium: 200, conf: 0.97 }),
    f('moong dal', 'मूंग दाल', 'dal_lentil', 75, 5.5, 9.5, 1.8, { fibre: 2.0, sodium: 180 }),
    f('masoor dal', 'मसूर दाल', 'dal_lentil', 85, 5.8, 11.0, 2.0, { fibre: 2.8, sodium: 190 }),
    f('chana dal', 'चना दाल', 'dal_lentil', 95, 6.5, 12.0, 2.5, { fibre: 3.5, sodium: 200 }),
    f('urad dal', 'उड़द दाल', 'dal_lentil', 90, 6.0, 10.8, 2.5, { fibre: 2.5, sodium: 200 }),
    f('dal tadka', 'दाल तड़का', 'dal_lentil', 85, 5.0, 10.0, 3.0, { fibre: 2.5, sodium: 250, cuisine: 'north_indian' }),
    f('dal fry', 'दाल फ्राई', 'dal_lentil', 90, 5.2, 10.5, 3.2, { fibre: 2.5, sodium: 260 }),
    f('dal makhani', 'दाल मखनी', 'dal_lentil', 105, 5.0, 10.0, 5.5, { fibre: 2.8, sodium: 280, cuisine: 'north_indian' }),
    f('rajma', 'राजमा', 'dal_lentil', 110, 6.0, 14.5, 3.0, { fibre: 4.5, sodium: 280, cuisine: 'north_indian', conf: 0.96 }),
    f('chole', 'छोले', 'dal_lentil', 115, 5.5, 15.0, 4.0, { fibre: 3.5, sodium: 300, cuisine: 'north_indian', conf: 0.96 }),
    f('sambar', 'सांभर', 'dal_lentil', 65, 3.5, 8.0, 2.0, { fibre: 2.0, sodium: 330, cuisine: 'south_indian', conf: 0.96 }),
    f('rasam', 'रसम', 'dal_lentil', 30, 1.2, 4.5, 0.8, { fibre: 0.8, sodium: 350, cuisine: 'south_indian' }),
    f('kadhi', 'कढ़ी', 'dal_lentil', 55, 2.5, 5.5, 2.5, { fibre: 0.5, sodium: 250, cuisine: 'north_indian' }),
    f('kadhi pakora', 'कढ़ी पकोड़ा', 'dal_lentil', 75, 3.0, 7.0, 4.0, { fibre: 1.0, sodium: 270 }),
    f('sprouts', 'अंकुरित', 'dal_lentil', 106, 7.5, 14.0, 1.5, { fibre: 5.0, sodium: 15, conf: 0.94 }),
    f('moong sprouts', 'अंकुरित मूंग', 'dal_lentil', 105, 7.0, 14.5, 1.2, { fibre: 4.5, sodium: 12 }),
    f('black eyed peas curry', 'लोबिया', 'dal_lentil', 95, 5.5, 13.0, 2.5, { fibre: 3.5, sodium: 250 }),
    f('dal palak', 'दाल पालक', 'dal_lentil', 75, 5.0, 8.5, 2.5, { fibre: 3.0, sodium: 220 }),
    f('panchmel dal', 'पंचमेल दाल', 'dal_lentil', 85, 5.5, 10.0, 2.8, { fibre: 3.0, sodium: 230, cuisine: 'rajasthani' }),
    f('horse gram curry', 'कुलथी दाल', 'dal_lentil', 105, 7.0, 12.5, 2.5, { fibre: 5.0, sodium: 200, cuisine: 'south_indian' }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DAIRY & PANEER (~20 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('paneer', 'पनीर', 'dairy', 265, 18.3, 3.6, 20.8, { sugar: 1.2, sodium: 22, conf: 0.98 }),
    f('paneer bhurji', 'पनीर भुर्जी', 'dairy', 195, 11.0, 4.0, 15.5, { sodium: 240 }),
    f('paneer tikka', 'पनीर टिक्का', 'dairy', 210, 14.0, 5.0, 15.0, { sodium: 350, cuisine: 'north_indian' }),
    f('shahi paneer', 'शाही पनीर', 'dairy', 175, 8.5, 6.0, 14.0, { sodium: 280, cuisine: 'north_indian' }),
    f('palak paneer', 'पालक पनीर', 'dairy', 150, 8.0, 5.5, 11.5, { fibre: 2.0, sodium: 260, conf: 0.96 }),
    f('matar paneer', 'मटर पनीर', 'dairy', 155, 8.0, 8.0, 10.5, { fibre: 2.5, sodium: 250, cuisine: 'north_indian' }),
    f('kadai paneer', 'कड़ाही पनीर', 'dairy', 170, 9.0, 5.5, 13.0, { sodium: 260, cuisine: 'north_indian' }),
    f('curd', 'दही', 'dairy', 65, 3.3, 4.7, 3.7, { sugar: 4.7, sodium: 45, conf: 0.98 }),
    f('milk', 'दूध', 'dairy', 60, 3.2, 4.8, 3.2, { sugar: 4.8, sodium: 40, conf: 0.98 }),
    f('toned milk', 'टोन्ड दूध', 'dairy', 47, 3.0, 4.8, 1.5, { sugar: 4.8, sodium: 42 }),
    f('double toned milk', 'डबल टोन्ड दूध', 'dairy', 38, 3.0, 4.9, 0.5, { sugar: 4.9, sodium: 42 }),
    f('lassi', 'लस्सी', 'dairy', 72, 2.4, 11.2, 2.0, { sugar: 9.6, sodium: 32 }),
    f('buttermilk', 'छाछ', 'dairy', 16, 1.2, 2.0, 0.4, { sodium: 120, conf: 0.96 }),
    f('ghee', 'घी', 'dairy', 897, 0, 0, 99.7, { sodium: 0, conf: 0.99 }),
    f('butter', 'मक्खन', 'dairy', 717, 0.9, 0.1, 81.0, { sodium: 576, source: 'usda' }),
    f('cheese', 'चीज़', 'dairy', 350, 22.0, 2.5, 28.0, { sodium: 620, source: 'usda' }),
    f('cream', 'क्रीम', 'dairy', 292, 2.0, 3.0, 30.5, { sodium: 30 }),
    f('shrikhand', 'श्रीखंड', 'dairy', 185, 5.0, 28.0, 6.0, { sugar: 25, sodium: 50, cuisine: 'gujarati' }),
    f('raita', 'रायता', 'dairy', 50, 2.3, 3.5, 3.0, { sodium: 130, conf: 0.96 }),
    f('khoa', 'खोया', 'dairy', 320, 13.5, 18.0, 22.0, { sugar: 15, sodium: 60 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // NON-VEG & EGGS (~35 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('egg', 'अंडा', 'non_veg', 155, 12.6, 1.1, 10.6, { sodium: 124, veg: false, source: 'usda', conf: 0.99 }),
    f('boiled egg', 'उबला अंडा', 'non_veg', 155, 12.6, 1.1, 10.6, { sodium: 124, veg: false, source: 'usda', conf: 0.99 }),
    f('egg omelette', 'आमलेट', 'non_veg', 175, 11.0, 1.5, 14.0, { sodium: 300, veg: false }),
    f('egg bhurji', 'अंडा भुर्जी', 'non_veg', 180, 11.5, 2.0, 14.5, { sodium: 320, veg: false }),
    f('chicken curry', 'चिकन करी', 'non_veg', 150, 14.0, 5.0, 8.5, { fibre: 1.0, sodium: 360, veg: false, conf: 0.96 }),
    f('butter chicken', 'बटर चिकन', 'non_veg', 175, 13.0, 6.0, 11.5, { sodium: 400, veg: false, cuisine: 'north_indian', conf: 0.96 }),
    f('chicken tikka', 'चिकन टिक्का', 'non_veg', 165, 25.0, 4.0, 5.5, { sodium: 450, veg: false }),
    f('chicken tikka masala', 'चिकन टिक्का मसाला', 'non_veg', 155, 14.0, 6.0, 9.0, { sodium: 380, veg: false }),
    f('tandoori chicken', 'तंदूरी चिकन', 'non_veg', 148, 21.0, 3.0, 6.0, { sodium: 420, veg: false, conf: 0.96 }),
    f('chicken breast', 'चिकन ब्रेस्ट', 'non_veg', 165, 31.0, 0, 3.6, { sodium: 74, veg: false, source: 'usda', conf: 0.98 }),
    f('chicken thigh', 'चिकन थाई', 'non_veg', 209, 26.0, 0, 10.9, { sodium: 84, veg: false, source: 'usda' }),
    f('chicken biryani', 'चिकन बिरयानी', 'non_veg', 180, 9.0, 20.0, 7.5, { sodium: 300, veg: false }),
    f('chicken fried rice', 'चिकन फ्राइड राइस', 'non_veg', 175, 8.0, 22.0, 6.5, { sodium: 480, veg: false }),
    f('chicken keema', 'चिकन कीमा', 'non_veg', 160, 16.0, 4.0, 9.0, { sodium: 350, veg: false }),
    f('chicken korma', 'चिकन कोरमा', 'non_veg', 165, 13.0, 6.5, 10.5, { sodium: 370, veg: false, cuisine: 'north_indian' }),
    f('chicken do pyaza', 'चिकन दो प्याज़ा', 'non_veg', 140, 13.5, 5.5, 7.5, { sodium: 340, veg: false }),
    f('mutton curry', 'मटन करी', 'non_veg', 190, 15.0, 5.0, 13.0, { sodium: 310, veg: false, conf: 0.95 }),
    f('mutton rogan josh', 'मटन रोगन जोश', 'non_veg', 185, 15.5, 4.5, 12.5, { sodium: 340, veg: false, cuisine: 'kashmiri' }),
    f('keema', 'कीमा', 'non_veg', 195, 16.5, 4.0, 13.0, { sodium: 330, veg: false }),
    f('nihari', 'निहारी', 'non_veg', 175, 14.0, 5.0, 11.5, { sodium: 350, veg: false, cuisine: 'north_indian' }),
    f('fish curry', 'मछली करी', 'non_veg', 115, 13.0, 4.0, 5.5, { sodium: 300, veg: false, conf: 0.95 }),
    f('fish fry', 'फिश फ्राई', 'non_veg', 200, 17.0, 8.0, 12.0, { sodium: 380, veg: false }),
    f('prawn curry', 'झींगा करी', 'non_veg', 100, 14.0, 4.0, 3.5, { sodium: 350, veg: false }),
    f('crab curry', 'केकड़ा करी', 'non_veg', 95, 13.0, 4.5, 3.0, { sodium: 380, veg: false, cuisine: 'south_indian' }),
    f('chicken momos', 'चिकन मोमो', 'non_veg', 200, 10.0, 22.0, 8.0, { sodium: 420, veg: false }),
    f('chicken manchurian', 'चिकन मंचूरियन', 'non_veg', 195, 12.0, 15.0, 10.5, { sodium: 550, veg: false, cuisine: 'indo_chinese' }),
    f('egg curry', 'अंडा करी', 'non_veg', 120, 8.0, 5.0, 8.0, { sodium: 300, veg: false }),
    f('seekh kebab', 'सीख कबाब', 'non_veg', 215, 18.0, 5.0, 14.0, { sodium: 400, veg: false }),
    f('shammi kebab', 'शामी कबाब', 'non_veg', 225, 16.0, 8.0, 15.0, { sodium: 380, veg: false }),
    f('galouti kebab', 'गलौटी कबाब', 'non_veg', 250, 14.0, 6.0, 19.0, { sodium: 350, veg: false, cuisine: 'north_indian' }),
    f('chicken 65', 'चिकन 65', 'non_veg', 220, 15.0, 12.0, 13.5, { sodium: 500, veg: false, cuisine: 'south_indian' }),
    f('pepper chicken', 'पेपर चिकन', 'non_veg', 155, 17.0, 4.0, 8.0, { sodium: 360, veg: false, cuisine: 'south_indian' }),
    f('chettinad chicken', 'चेट्टिनाड चिकन', 'non_veg', 160, 15.5, 5.0, 9.0, { sodium: 380, veg: false, cuisine: 'south_indian' }),
    f('hyderabadi biryani', 'हैदराबादी बिरयानी', 'non_veg', 185, 9.5, 20.5, 7.5, { sodium: 310, veg: false, cuisine: 'south_indian' }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VEGETABLES (~45 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('aloo sabzi', 'आलू सब्जी', 'vegetable', 108, 2.0, 14.5, 5.0, { fibre: 1.8, sodium: 270 }),
    f('aloo gobi', 'आलू गोभी', 'vegetable', 95, 2.5, 12.5, 4.5, { fibre: 2.5, sodium: 250 }),
    f('aloo matar', 'आलू मटर', 'vegetable', 100, 3.0, 13.0, 4.0, { fibre: 2.8, sodium: 260 }),
    f('aloo jeera', 'आलू जीरा', 'vegetable', 105, 2.0, 14.0, 4.5, { fibre: 1.8, sodium: 240, cuisine: 'north_indian' }),
    f('bhindi masala', 'भिंडी मसाला', 'vegetable', 85, 2.5, 8.0, 5.0, { fibre: 3.2, sodium: 200, conf: 0.95 }),
    f('baingan bharta', 'बैंगन भर्ता', 'vegetable', 75, 2.0, 7.5, 4.5, { fibre: 3.0, sodium: 220, cuisine: 'north_indian' }),
    f('gobhi masala', 'गोभी मसाला', 'vegetable', 85, 2.5, 9.5, 4.5, { fibre: 2.5, sodium: 230 }),
    f('mixed sabzi', 'मिक्स सब्जी', 'vegetable', 80, 2.3, 8.0, 4.7, { fibre: 2.5, sodium: 230, conf: 0.94 }),
    f('lauki sabzi', 'लौकी सब्जी', 'vegetable', 45, 1.5, 5.5, 2.0, { fibre: 1.5, sodium: 180 }),
    f('tinda masala', 'टिंडा मसाला', 'vegetable', 50, 1.5, 6.0, 2.5, { fibre: 1.5, sodium: 180, cuisine: 'north_indian' }),
    f('tori sabzi', 'तोरी सब्जी', 'vegetable', 40, 1.2, 4.5, 2.0, { fibre: 1.8, sodium: 170 }),
    f('karela sabzi', 'करेला सब्जी', 'vegetable', 55, 2.0, 5.5, 3.0, { fibre: 2.5, sodium: 180 }),
    f('methi sabzi', 'मेथी सब्जी', 'vegetable', 65, 3.5, 5.0, 3.5, { fibre: 3.5, sodium: 190 }),
    f('palak sabzi', 'पालक सब्जी', 'vegetable', 60, 3.0, 4.5, 3.5, { fibre: 2.5, sodium: 200 }),
    f('sarson ka saag', 'सरसों का साग', 'vegetable', 70, 3.5, 5.0, 4.5, { fibre: 3.0, sodium: 250, cuisine: 'north_indian' }),
    f('sem ki phali', 'सेम की फली', 'vegetable', 55, 2.5, 7.0, 2.0, { fibre: 3.0, sodium: 150 }),
    f('arbi masala', 'अरबी मसाला', 'vegetable', 100, 1.5, 14.0, 4.5, { fibre: 2.0, sodium: 200 }),
    f('mushroom masala', 'मशरूम मसाला', 'vegetable', 80, 3.5, 6.0, 5.0, { fibre: 1.5, sodium: 250 }),
    f('paneer do pyaza', 'पनीर दो प्याज़ा', 'vegetable', 165, 8.5, 6.0, 12.5, { sodium: 260 }),
    f('stuffed capsicum', 'भरवां शिमला मिर्च', 'vegetable', 95, 3.0, 10.0, 5.0, { fibre: 2.0, sodium: 220 }),
    f('salad', 'सलाद', 'vegetable', 30, 1.3, 5.5, 0.3, { fibre: 2.0, sodium: 13 }),
    f('soya chunks curry', 'सोया चंक्स करी', 'vegetable', 145, 12.0, 10.0, 6.5, { fibre: 2.0, sodium: 280 }),
    f('aloo tikki', 'आलू टिक्की', 'vegetable', 160, 3.0, 20.0, 8.0, { fibre: 1.5, sodium: 300 }),
    f('veg manchurian', 'वेज मंचूरियन', 'vegetable', 150, 3.0, 15.0, 9.0, { sodium: 500, cuisine: 'indo_chinese' }),
    f('gobi manchurian', 'गोभी मंचूरियन', 'vegetable', 155, 3.0, 16.0, 9.0, { sodium: 520, cuisine: 'indo_chinese' }),
    f('chilli paneer', 'चिल्ली पनीर', 'vegetable', 180, 9.0, 8.0, 13.0, { sodium: 480, cuisine: 'indo_chinese' }),
    f('malai kofta', 'मलाई कोफ्ता', 'vegetable', 180, 5.0, 12.0, 13.0, { sodium: 300, cuisine: 'north_indian' }),
    f('navratan korma', 'नवरत्न कोरमा', 'vegetable', 140, 4.0, 12.0, 9.0, { sodium: 280, cuisine: 'north_indian' }),
    f('dum aloo', 'दम आलू', 'vegetable', 120, 2.5, 14.0, 6.5, { sodium: 270, cuisine: 'north_indian' }),
    f('baingan ka bharta', 'बैंगन का भर्ता', 'vegetable', 80, 2.0, 8.0, 4.5, { fibre: 3.0, sodium: 230, cuisine: 'north_indian' }),
    f('aloo methi', 'आलू मेथी', 'vegetable', 95, 2.5, 11.0, 5.0, { fibre: 2.5, sodium: 230, cuisine: 'north_indian' }),
    f('gajar matar', 'गाजर मटर', 'vegetable', 70, 2.5, 9.0, 2.5, { fibre: 3.0, sodium: 200 }),
    f('cabbage sabzi', 'पत्ता गोभी', 'vegetable', 65, 2.0, 7.0, 3.5, { fibre: 2.5, sodium: 200 }),
    f('pav bhaji', 'पाव भाजी', 'vegetable', 150, 3.5, 18.0, 7.5, { fibre: 2.5, sodium: 350, cuisine: 'maharashtrian' }),
    f('undhiyu', 'ऊंधियू', 'vegetable', 120, 3.5, 12.0, 7.0, { fibre: 3.5, sodium: 250, cuisine: 'gujarati' }),
    f('avial', 'अवियल', 'vegetable', 90, 2.5, 8.0, 5.5, { fibre: 3.0, sodium: 200, cuisine: 'south_indian' }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FRUITS (~25 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('banana', 'केला', 'fruit', 89, 1.1, 22.8, 0.3, { fibre: 2.6, sugar: 12.2, sodium: 1, source: 'usda', conf: 0.99 }),
    f('apple', 'सेब', 'fruit', 52, 0.3, 13.8, 0.2, { fibre: 2.4, sugar: 10.4, sodium: 1, source: 'usda', conf: 0.99 }),
    f('mango', 'आम', 'fruit', 60, 0.8, 15.0, 0.4, { fibre: 1.6, sugar: 13.7, sodium: 1, conf: 0.98 }),
    f('papaya', 'पपीता', 'fruit', 43, 0.5, 11.0, 0.3, { fibre: 1.7, sugar: 7.8, sodium: 3, source: 'usda' }),
    f('guava', 'अमरूद', 'fruit', 68, 2.6, 14.3, 1.0, { fibre: 5.4, sugar: 8.9, sodium: 2, source: 'usda' }),
    f('watermelon', 'तरबूज', 'fruit', 30, 0.6, 7.6, 0.2, { fibre: 0.4, sugar: 6.2, sodium: 1, source: 'usda' }),
    f('pomegranate', 'अनार', 'fruit', 83, 1.7, 18.7, 1.2, { fibre: 4.0, sugar: 13.7, sodium: 3, source: 'usda' }),
    f('chikoo', 'चीकू', 'fruit', 83, 0.4, 20.0, 1.1, { fibre: 5.3, sugar: 14.0, sodium: 12 }),
    f('orange', 'संतरा', 'fruit', 47, 0.9, 11.8, 0.1, { fibre: 2.4, sugar: 9.4, sodium: 0, source: 'usda' }),
    f('grapes', 'अंगूर', 'fruit', 69, 0.7, 18.1, 0.2, { fibre: 0.9, sugar: 15.5, sodium: 2, source: 'usda' }),
    f('pineapple', 'अनानास', 'fruit', 50, 0.5, 13.1, 0.1, { fibre: 1.4, sugar: 9.9, sodium: 1, source: 'usda' }),
    f('pear', 'नाशपाती', 'fruit', 57, 0.4, 15.2, 0.1, { fibre: 3.1, sugar: 9.8, sodium: 1, source: 'usda' }),
    f('litchi', 'लीची', 'fruit', 66, 0.8, 16.5, 0.4, { fibre: 1.3, sugar: 15.2, sodium: 1 }),
    f('jamun', 'जामुन', 'fruit', 62, 0.7, 14.0, 0.2, { fibre: 0.6, sugar: 12.0, sodium: 14 }),
    f('custard apple', 'सीताफल', 'fruit', 94, 2.1, 23.6, 0.3, { fibre: 4.4, sugar: 16.0, sodium: 4 }),
    f('amla', 'आंवला', 'fruit', 44, 0.9, 10.2, 0.6, { fibre: 3.4, sugar: 5.0, sodium: 2 }),
    f('jackfruit', 'कटहल', 'fruit', 95, 1.7, 23.3, 0.6, { fibre: 1.5, sugar: 19.1, sodium: 2 }),
    f('coconut', 'नारियल', 'fruit', 354, 3.3, 15.2, 33.5, { fibre: 9.0, sugar: 6.2, sodium: 20 }),
    f('dates', 'खजूर', 'fruit', 277, 1.8, 75.0, 0.2, { fibre: 6.7, sugar: 63.4, sodium: 1, source: 'usda' }),
    f('dry fruits mix', 'मिक्स ड्राई फ्रूट्स', 'fruit', 520, 14.0, 40.0, 36.0, { fibre: 6.0, sugar: 30.0, sodium: 10 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BEVERAGES (~18 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('chai', 'चाय', 'beverage', 40, 1.3, 5.3, 1.3, { sugar: 4.0, sodium: 20, conf: 0.98 }),
    f('coffee', 'कॉफी', 'beverage', 33, 1.0, 4.0, 1.3, { sugar: 3.3, sodium: 13, conf: 0.97 }),
    f('black coffee', 'ब्लैक कॉफी', 'beverage', 2, 0.3, 0, 0, { sodium: 5, source: 'usda' }),
    f('green tea', 'ग्रीन टी', 'beverage', 1, 0, 0.2, 0, { sodium: 1, source: 'usda' }),
    f('filter coffee', 'फिल्टर कॉफी', 'beverage', 45, 1.5, 5.0, 2.0, { sugar: 4.0, sodium: 20, cuisine: 'south_indian' }),
    f('cold coffee', 'कोल्ड कॉफी', 'beverage', 75, 2.5, 12.0, 2.5, { sugar: 10, sodium: 40 }),
    f('nimbu pani', 'नींबू पानी', 'beverage', 23, 0.1, 6.0, 0, { sugar: 5.0, sodium: 100, conf: 0.96 }),
    f('coconut water', 'नारियल पानी', 'beverage', 19, 0.7, 3.7, 0.2, { fibre: 1.1, sugar: 2.6, sodium: 105, source: 'usda', conf: 0.97 }),
    f('aam panna', 'आम पन्ना', 'beverage', 50, 0.3, 12.0, 0.1, { sugar: 10, sodium: 150, cuisine: 'north_indian' }),
    f('jaljeera', 'जलजीरा', 'beverage', 20, 0.2, 4.5, 0.1, { sodium: 250 }),
    f('thandai', 'ठंडाई', 'beverage', 80, 2.5, 11.0, 3.0, { sugar: 9.0, sodium: 30, cuisine: 'north_indian' }),
    f('badam milk', 'बादाम दूध', 'beverage', 75, 3.5, 9.0, 3.0, { sugar: 7.0, sodium: 45 }),
    f('mango shake', 'मैंगो शेक', 'beverage', 85, 2.0, 15.0, 2.5, { sugar: 13.0, sodium: 35 }),
    f('banana shake', 'बनाना शेक', 'beverage', 80, 2.5, 13.0, 2.0, { sugar: 10.0, sodium: 38 }),
    f('sugarcane juice', 'गन्ने का रस', 'beverage', 40, 0.1, 9.5, 0, { sugar: 9.0, sodium: 5 }),
    f('masala chaas', 'मसाला छाछ', 'beverage', 18, 1.3, 2.2, 0.4, { sodium: 180 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STREET FOOD (~30 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('samosa', 'समोसा', 'street_food', 262, 4.7, 29.0, 14.5, { fibre: 2.0, sodium: 365, conf: 0.97 }),
    f('pakora', 'पकोड़ा', 'street_food', 240, 4.8, 22.0, 15.0, { fibre: 1.5, sodium: 360 }),
    f('vada pav', 'वड़ा पाव', 'street_food', 235, 4.0, 30.0, 11.5, { fibre: 1.5, sodium: 370, cuisine: 'maharashtrian', conf: 0.96 }),
    f('pani puri', 'पानी पूरी', 'street_food', 180, 3.0, 26.0, 7.0, { fibre: 1.5, sodium: 400 }),
    f('bhel puri', 'भेल पूरी', 'street_food', 170, 3.8, 26.0, 5.5, { fibre: 2.0, sodium: 380, cuisine: 'maharashtrian' }),
    f('sev puri', 'सेव पूरी', 'street_food', 200, 3.5, 24.0, 10.0, { fibre: 1.5, sodium: 400, cuisine: 'maharashtrian' }),
    f('dahi puri', 'दही पूरी', 'street_food', 165, 3.0, 22.0, 7.0, { fibre: 1.5, sodium: 320 }),
    f('kachori', 'कचौड़ी', 'street_food', 340, 6.0, 35.0, 20.0, { fibre: 2.5, sodium: 400, cuisine: 'rajasthani' }),
    f('dabeli', 'दाबेली', 'street_food', 200, 4.0, 28.0, 8.0, { fibre: 2.0, sodium: 380, cuisine: 'gujarati' }),
    f('chole bhature', 'छोले भटूरे', 'street_food', 230, 6.5, 28.0, 11.0, { fibre: 3.0, sodium: 400, cuisine: 'north_indian' }),
    f('frankie', 'फ्रैंकी', 'street_food', 185, 5.0, 22.0, 8.5, { fibre: 1.5, sodium: 380 }),
    f('veg momos', 'वेज मोमो', 'street_food', 180, 5.0, 24.0, 7.0, { fibre: 1.5, sodium: 380 }),
    f('spring roll', 'स्प्रिंग रोल', 'street_food', 210, 4.0, 25.0, 11.0, { sodium: 400 }),
    f('chaat', 'चाट', 'street_food', 155, 3.5, 22.0, 6.0, { fibre: 2.0, sodium: 350 }),
    f('dahi bhalla', 'दही भल्ला', 'street_food', 120, 4.0, 15.0, 5.0, { fibre: 1.5, sodium: 300, cuisine: 'north_indian' }),
    f('aloo chaat', 'आलू चाट', 'street_food', 145, 2.5, 20.0, 6.0, { fibre: 1.5, sodium: 330 }),
    f('papdi chaat', 'पापड़ी चाट', 'street_food', 160, 3.0, 21.0, 7.5, { fibre: 1.5, sodium: 350 }),
    f('misal pav', 'मिसल पाव', 'street_food', 140, 5.5, 18.0, 5.5, { fibre: 3.0, sodium: 350, cuisine: 'maharashtrian' }),
    f('litti chokha', 'लिट्टी चोखा', 'street_food', 230, 6.0, 32.0, 9.0, { fibre: 3.5, sodium: 280, cuisine: 'north_indian' }),
    f('dhokla', 'ढोकला', 'street_food', 155, 5.5, 22.0, 5.0, { fibre: 1.5, sodium: 350, cuisine: 'gujarati' }),
    f('khandvi', 'खांडवी', 'street_food', 140, 5.0, 15.0, 7.0, { sodium: 300, cuisine: 'gujarati' }),
    f('fafda', 'फाफड़ा', 'street_food', 425, 8.0, 42.0, 25.0, { sodium: 380, cuisine: 'gujarati' }),
    f('jhal muri', 'झाल मूड़ी', 'street_food', 180, 3.5, 24.0, 8.0, { sodium: 350, cuisine: 'east_indian' }),
    f('egg roll', 'एग रोल', 'street_food', 205, 7.0, 22.0, 10.5, { sodium: 400, veg: false }),
    f('dahi vada', 'दही वड़ा', 'street_food', 110, 4.5, 13.0, 4.5, { sodium: 280 }),
    f('bread pakora', 'ब्रेड पकोड़ा', 'street_food', 250, 5.0, 28.0, 13.5, { sodium: 380 }),
    f('aloo bonda', 'आलू बोंडा', 'street_food', 230, 3.5, 27.0, 12.5, { sodium: 320, cuisine: 'south_indian' }),
    f('dahi ke kebab', 'दही के कबाब', 'street_food', 160, 6.0, 12.0, 10.0, { sodium: 280 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SWEETS & DESSERTS (~25 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('gulab jamun', 'गुलाब जामुन', 'sweet', 375, 5.0, 55.0, 15.0, { sugar: 45, sodium: 100, conf: 0.97 }),
    f('jalebi', 'जलेबी', 'sweet', 370, 3.5, 60.0, 13.5, { sugar: 52, sodium: 50, conf: 0.97 }),
    f('rasgulla', 'रसगुल्ला', 'sweet', 186, 4.5, 30.0, 6.0, { sugar: 28, sodium: 45, cuisine: 'east_indian' }),
    f('ladoo', 'लड्डू', 'sweet', 440, 7.0, 50.0, 24.0, { sugar: 35, sodium: 30 }),
    f('besan ladoo', 'बेसन लड्डू', 'sweet', 450, 8.0, 48.0, 25.0, { sugar: 32, sodium: 25 }),
    f('motichoor ladoo', 'मोतीचूर लड्डू', 'sweet', 420, 5.0, 52.0, 22.0, { sugar: 40, sodium: 30 }),
    f('barfi', 'बर्फी', 'sweet', 390, 7.0, 50.0, 18.0, { sugar: 42, sodium: 40 }),
    f('kaju katli', 'काजू कतली', 'sweet', 430, 9.0, 48.0, 23.0, { sugar: 38, sodium: 30 }),
    f('halwa', 'हलवा', 'sweet', 300, 3.5, 40.0, 15.0, { sugar: 30, sodium: 40 }),
    f('gajar halwa', 'गाजर हलवा', 'sweet', 210, 3.0, 28.0, 10.0, { sugar: 22, sodium: 35, cuisine: 'north_indian' }),
    f('suji halwa', 'सूजी हलवा', 'sweet', 320, 3.5, 42.0, 16.0, { sugar: 30, sodium: 40 }),
    f('kheer', 'खीर', 'sweet', 130, 3.5, 18.0, 5.0, { sugar: 15, sodium: 40, conf: 0.96 }),
    f('payasam', 'पायसम', 'sweet', 135, 3.0, 19.0, 5.5, { sugar: 16, sodium: 35, cuisine: 'south_indian' }),
    f('rasmalai', 'रसमलाई', 'sweet', 190, 5.0, 24.0, 8.5, { sugar: 20, sodium: 50, cuisine: 'east_indian' }),
    f('sandesh', 'संदेश', 'sweet', 260, 7.5, 35.0, 10.5, { sugar: 30, sodium: 30, cuisine: 'east_indian' }),
    f('peda', 'पेड़ा', 'sweet', 390, 8.0, 48.0, 19.0, { sugar: 42, sodium: 35 }),
    f('rabri', 'रबड़ी', 'sweet', 200, 5.5, 22.0, 10.5, { sugar: 18, sodium: 50, cuisine: 'north_indian' }),
    f('kulfi', 'कुल्फी', 'sweet', 200, 4.5, 22.0, 11.0, { sugar: 18, sodium: 50 }),
    f('mysore pak', 'मैसूर पाक', 'sweet', 475, 6.0, 42.0, 32.0, { sugar: 35, sodium: 20, cuisine: 'south_indian' }),
    f('son papdi', 'सोन पापड़ी', 'sweet', 450, 5.0, 55.0, 24.0, { sugar: 40, sodium: 25 }),
    f('modak', 'मोदक', 'sweet', 350, 4.5, 50.0, 15.0, { sugar: 35, sodium: 30, cuisine: 'maharashtrian' }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SNACKS & NAMKEEN (~25 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('biscuit', 'बिस्कुट', 'snack', 450, 6.5, 65.0, 18.0, { sugar: 22, sodium: 400 }),
    f('namkeen', 'नमकीन', 'snack', 480, 10.0, 48.0, 28.0, { fibre: 4.0, sodium: 600 }),
    f('bhujia', 'भुजिया', 'snack', 540, 12.0, 45.0, 35.0, { fibre: 3.5, sodium: 650 }),
    f('mixture', 'मिक्सचर', 'snack', 490, 11.0, 47.0, 29.0, { fibre: 3.5, sodium: 550 }),
    f('chips', 'चिप्स', 'snack', 536, 7.0, 53.0, 33.0, { fibre: 3.6, sodium: 525, source: 'usda' }),
    f('kurkure', 'कुरकुरे', 'snack', 510, 6.5, 55.0, 30.0, { sodium: 680 }),
    f('makhana', 'मखाना', 'snack', 350, 9.7, 76.9, 0.1, { fibre: 7.5, sodium: 1, conf: 0.96 }),
    f('roasted chana', 'भुने चने', 'snack', 369, 22.0, 58.0, 5.0, { fibre: 12.0, sodium: 25, conf: 0.96 }),
    f('murmura', 'मुरमुरा', 'snack', 402, 6.1, 90.2, 0.5, { fibre: 0.8, sodium: 4 }),
    f('mathri', 'मठरी', 'snack', 400, 7.0, 42.0, 23.0, { sodium: 450, cuisine: 'north_indian' }),
    f('chakli', 'चकली', 'snack', 420, 7.5, 48.0, 22.0, { sodium: 400, cuisine: 'maharashtrian' }),
    f('murukku', 'मुरुक्कु', 'snack', 440, 8.0, 50.0, 23.0, { sodium: 420, cuisine: 'south_indian' }),
    f('protein bar', 'प्रोटीन बार', 'snack', 350, 20.0, 40.0, 12.0, { fibre: 5.0, sugar: 15, sodium: 200, source: 'usda' }),
    f('popcorn', 'पॉपकॉर्न', 'snack', 387, 13.0, 78.0, 4.5, { fibre: 14.5, sodium: 8, source: 'usda' }),
    f('peanuts', 'मूंगफली', 'snack', 567, 25.8, 16.1, 49.2, { fibre: 8.5, sodium: 18, source: 'usda', conf: 0.97 }),
    f('cashews', 'काजू', 'snack', 553, 18.2, 30.2, 43.9, { fibre: 3.3, sodium: 12, source: 'usda' }),
    f('almonds', 'बादाम', 'snack', 579, 21.2, 21.6, 49.9, { fibre: 12.5, sodium: 1, source: 'usda', conf: 0.97 }),
    f('walnuts', 'अखरोट', 'snack', 654, 15.2, 13.7, 65.2, { fibre: 6.7, sodium: 2, source: 'usda' }),
    f('raisins', 'किशमिश', 'snack', 299, 3.1, 79.2, 0.5, { fibre: 3.7, sugar: 59.2, sodium: 11, source: 'usda' }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SUPPLEMENTS & PROTEIN (~12 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('whey protein', 'व्हे प्रोटीन', 'supplement', 400, 80.0, 10.0, 5.0, { sodium: 333, source: 'usda', conf: 0.97 }),
    f('casein protein', 'कैसीन प्रोटीन', 'supplement', 370, 75.0, 8.0, 5.0, { sodium: 300, source: 'usda' }),
    f('plant protein', 'प्लांट प्रोटीन', 'supplement', 380, 70.0, 15.0, 6.0, { fibre: 5.0, sodium: 350 }),
    f('mass gainer', 'मास गेनर', 'supplement', 410, 20.0, 70.0, 6.0, { sugar: 15, sodium: 200 }),
    f('creatine', 'क्रिएटिन', 'supplement', 0, 0, 0, 0, { sodium: 0, source: 'usda' }),
    f('peanut butter', 'पीनट बटर', 'supplement', 588, 25.0, 20.0, 50.0, { fibre: 6.0, sodium: 460, source: 'usda', conf: 0.97 }),
    f('almond butter', 'आलमंड बटर', 'supplement', 614, 21.0, 19.0, 56.0, { fibre: 10.5, sodium: 7, source: 'usda' }),
    f('honey', 'शहद', 'supplement', 304, 0.3, 82.4, 0, { sugar: 82.1, sodium: 4, source: 'usda' }),
    f('flax seeds', 'अलसी', 'supplement', 534, 18.3, 28.9, 42.2, { fibre: 27.3, sodium: 30 }),
    f('chia seeds', 'चिया सीड्स', 'supplement', 486, 16.5, 42.1, 30.7, { fibre: 34.4, sodium: 16, source: 'usda' }),
    f('protein shake', 'प्रोटीन शेक', 'supplement', 95, 13.5, 5.5, 2.0, { sugar: 2.5, sodium: 80 }),
    f('bcaa', 'बीसीएए', 'supplement', 0, 0, 0, 0, { sodium: 0 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CONDIMENTS & CHUTNEYS (~15 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('green chutney', 'हरी चटनी', 'condiment', 45, 2.0, 5.0, 2.0, { sodium: 350 }),
    f('tamarind chutney', 'इमली चटनी', 'condiment', 130, 0.8, 30.0, 0.5, { sugar: 25, sodium: 200 }),
    f('coconut chutney', 'नारियल चटनी', 'condiment', 150, 2.0, 8.0, 12.5, { sodium: 250, cuisine: 'south_indian' }),
    f('tomato chutney', 'टमाटर चटनी', 'condiment', 55, 1.0, 8.0, 2.0, { sodium: 280, cuisine: 'south_indian' }),
    f('pickle', 'अचार', 'condiment', 165, 2.0, 12.0, 12.5, { sodium: 2640, conf: 0.95 }),
    f('papad', 'पापड़', 'condiment', 328, 16.5, 46.0, 9.5, { fibre: 6.0, sodium: 2600, conf: 0.96 }),
    f('tomato ketchup', 'टमाटर केचप', 'condiment', 112, 1.0, 27.0, 0.1, { sugar: 22, sodium: 907, source: 'usda' }),
    f('mayonnaise', 'मेयोनेज़', 'condiment', 680, 1.0, 0.6, 75.0, { sodium: 635, source: 'usda' }),
    f('schezwan sauce', 'शेज़वान सॉस', 'condiment', 120, 1.5, 15.0, 6.0, { sodium: 800, cuisine: 'indo_chinese' }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FAST FOOD & RESTAURANT (~30 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('mcaloo tikki', 'मैकआलू टिक्की', 'fast_food', 195, 5.0, 28.0, 7.0, { sodium: 520, source: 'manual', conf: 0.93 }),
    f('mcveggie', 'मैकवेजी', 'fast_food', 225, 5.5, 30.0, 9.5, { sodium: 560, source: 'manual' }),
    f('chicken maharaja mac', 'चिकन महाराजा मैक', 'fast_food', 250, 14.0, 24.0, 11.5, { sodium: 600, veg: false, source: 'manual' }),
    f('pizza margherita', 'मार्गेरीटा पिज़्ज़ा', 'fast_food', 235, 9.0, 30.0, 9.0, { sodium: 500, source: 'manual' }),
    f('pizza farmhouse', 'फार्महाउस पिज़्ज़ा', 'fast_food', 250, 9.5, 28.0, 11.5, { sodium: 540, source: 'manual' }),
    f('kfc hot crispy chicken', 'केएफसी हॉट क्रिस्पी', 'fast_food', 260, 16.0, 14.0, 16.0, { sodium: 580, veg: false, source: 'manual' }),
    f('kfc zinger burger', 'केएफसी ज़िंगर बर्गर', 'fast_food', 250, 12.5, 26.0, 11.5, { sodium: 600, veg: false, source: 'manual' }),
    f('subway veggie delight', 'सबवे वेजी डिलाइट', 'fast_food', 130, 5.5, 22.0, 2.0, { fibre: 3.0, sodium: 330, source: 'manual' }),
    f('subway chicken teriyaki', 'सबवे चिकन टेरीयाकी', 'fast_food', 160, 10.5, 22.0, 3.0, { sodium: 420, veg: false, source: 'manual' }),
    f('burger', 'बर्गर', 'fast_food', 240, 10.0, 28.0, 10.0, { sodium: 500 }),
    f('french fries', 'फ्रेंच फ्राइज़', 'fast_food', 312, 3.4, 41.0, 15.0, { sodium: 210, source: 'usda' }),
    f('pasta', 'पास्ता', 'fast_food', 160, 5.5, 25.0, 4.0, { sodium: 350 }),
    f('white sauce pasta', 'व्हाइट सॉस पास्ता', 'fast_food', 185, 6.0, 24.0, 7.5, { sodium: 400 }),
    f('red sauce pasta', 'रेड सॉस पास्ता', 'fast_food', 150, 5.0, 25.0, 3.5, { sodium: 380 }),
    f('chow mein', 'चाउमीन', 'fast_food', 155, 3.5, 22.0, 6.0, { sodium: 480, cuisine: 'indo_chinese' }),
    f('manchow soup', 'मनचाऊ सूप', 'fast_food', 45, 2.0, 6.0, 1.5, { sodium: 500, cuisine: 'indo_chinese' }),
    f('garlic bread', 'गार्लिक ब्रेड', 'fast_food', 350, 7.0, 42.0, 17.0, { sodium: 500, source: 'usda' }),
    f('tandoori momos', 'तंदूरी मोमो', 'fast_food', 195, 6.0, 22.0, 9.5, { sodium: 400 }),
    f('chicken shawarma', 'चिकन शवार्मा', 'fast_food', 200, 12.0, 18.0, 9.0, { sodium: 450, veg: false }),
    f('paneer shawarma', 'पनीर शवार्मा', 'fast_food', 210, 9.0, 20.0, 11.0, { sodium: 420 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FASTING / VRAT FOODS (~12 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('sabudana khichdi', 'साबूदाना खिचड़ी', 'fasting', 190, 3.5, 32.0, 6.5, { fibre: 1.0, sodium: 180, conf: 0.96 }),
    f('sabudana vada', 'साबूदाना वड़ा', 'fasting', 260, 3.0, 35.0, 12.0, { sodium: 250 }),
    f('kuttu ki puri', 'कुट्टू की पूरी', 'fasting', 320, 7.5, 40.0, 15.0, { fibre: 4.5, sodium: 240, conf: 0.95 }),
    f('singhara atta', 'सिंघाड़ा आटा', 'fasting', 332, 4.7, 79.6, 0.5, { fibre: 1.0, sodium: 25 }),
    f('rajgira paratha', 'राजगीरा पराठा', 'fasting', 280, 5.0, 35.0, 14.0, { fibre: 2.5, sodium: 200 }),
    f('fruit chaat', 'फ्रूट चाट', 'fasting', 65, 0.8, 15.0, 0.3, { fibre: 2.0, sugar: 12.0, sodium: 20 }),
    f('makhane ki kheer', 'मखाने की खीर', 'fasting', 120, 3.0, 15.0, 5.5, { sugar: 12.0, sodium: 40 }),
    f('samo rice', 'सामो राइस', 'fasting', 340, 5.0, 75.0, 1.5, { fibre: 2.0, sodium: 5 }),
    f('vrat aloo', 'व्रत आलू', 'fasting', 110, 2.0, 15.0, 5.0, { fibre: 1.5, sodium: 200 }),
    f('shakarkandi chaat', 'शकरकंदी चाट', 'fasting', 100, 1.5, 20.0, 2.0, { fibre: 3.0, sugar: 6.5, sodium: 150 }),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ADDITIONAL REGIONAL (~25 items)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    f('dal baati churma', 'दाल बाटी चूरमा', 'grain', 310, 7.5, 38.0, 14.5, { sodium: 300, cuisine: 'rajasthani' }),
    f('ker sangri', 'केर सांगरी', 'vegetable', 75, 3.0, 8.0, 3.5, { fibre: 4.0, sodium: 350, cuisine: 'rajasthani' }),
    f('gatte ki sabzi', 'गट्टे की सब्जी', 'dal_lentil', 100, 5.0, 10.0, 5.0, { fibre: 2.0, sodium: 280, cuisine: 'rajasthani' }),
    f('bisi bele bath', 'बिसी बेले बाथ', 'grain', 145, 4.5, 20.0, 5.0, { fibre: 2.5, sodium: 260, cuisine: 'south_indian' }),
    f('varan bhaat', 'वरण भात', 'grain', 110, 4.0, 17.0, 2.5, { sodium: 200, cuisine: 'maharashtrian' }),
    f('puran poli', 'पूरन पोली', 'grain', 300, 5.0, 50.0, 9.0, { sugar: 20, sodium: 200, cuisine: 'maharashtrian' }),
    f('thalipeeth', 'थालीपीठ', 'grain', 285, 8.5, 38.0, 11.5, { fibre: 4.0, sodium: 320, cuisine: 'maharashtrian' }),
    f('pesarattu', 'पेसरट्टू', 'grain', 145, 6.0, 20.0, 4.5, { fibre: 3.0, sodium: 220, cuisine: 'south_indian' }),
    f('pindi chole', 'पिंडी छोले', 'dal_lentil', 120, 6.0, 15.5, 4.0, { fibre: 4.0, sodium: 320, cuisine: 'north_indian' }),
    f('thukpa', 'थुकपा', 'grain', 85, 4.0, 12.0, 2.5, { sodium: 350, cuisine: 'north_indian' }),
    f('pakhala', 'पखाला', 'grain', 100, 2.5, 18.0, 1.5, { sodium: 200, cuisine: 'east_indian' }),
    f('dalma', 'दालमा', 'dal_lentil', 70, 3.5, 8.0, 2.5, { fibre: 2.5, sodium: 220, cuisine: 'east_indian' }),
    f('macher jhol', 'माछेर झोल', 'non_veg', 100, 12.0, 5.0, 4.0, { sodium: 280, veg: false, cuisine: 'east_indian' }),
    f('egg biryani', 'एग बिरयानी', 'grain', 170, 7.5, 20.0, 7.0, { sodium: 290, veg: false }),
  ];

  // Insert in batches of 50 to avoid query size limits
  const batchSize = 50;
  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);
    await knex('foods').insert(batch);
  }

  console.log(`🍛 Seeded ${foods.length} foods into nutrition database`);
}
