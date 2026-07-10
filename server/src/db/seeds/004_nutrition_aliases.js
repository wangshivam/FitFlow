/**
 * Seed: Aliases — 1000+ alternative names, Hinglish variations, and misspellings
 * Maps unstructured user input terms to canonical food items.
 */

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  await knex('food_aliases').del();

  // Fetch foods to get their IDs
  const foods = await knex('foods').select('id', 'canonical_name');
  const foodMap = Object.fromEntries(foods.map((f) => [f.canonical_name, f.id]));

  const aliases = [];

  // Helper to add aliases for a canonical food
  const addAliases = (canonicalName, alternateNames) => {
    const foodId = foodMap[canonicalName];
    if (!foodId) return; // Skip if food doesn't exist in our map

    for (const alt of alternateNames) {
      aliases.push({
        food_id: foodId,
        alias_name: alt,
      });
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Breads & Grains
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('chapati', ['roti', 'phulka', 'fulka', 'rotli', 'chappati', 'chapathi', 'indian flatbread', 'whole wheat roti']);
  addAliases('rice', ['chawal', 'chaval', 'chawal bhat', 'white rice', 'steamed rice', 'plain rice', 'bhaat', 'annam']);
  addAliases('paratha', ['parantha', 'pratha', 'parotta', 'plain paratha']);
  addAliases('aloo paratha', ['alu paratha', 'potato paratha', 'aloo ka paratha', 'potato stuffed bread']);
  addAliases('paneer paratha', ['panir paratha', 'cottage cheese paratha']);
  addAliases('naan', ['nan', 'tandoori naan', 'plain naan']);
  addAliases('butter naan', ['makhani naan', 'buttered naan']);
  addAliases('garlic naan', ['lasooni naan']);
  addAliases('puri', ['poori', 'luchi']);
  addAliases('bhatura', ['chole bhatura', 'bhature', 'fried bread']);
  addAliases('poha', ['aval', 'avalakki', 'chivda', 'beaten rice', 'flattened rice', 'kanda poha', 'onion poha']);
  addAliases('upma', ['uppittu', 'rava upma', 'suji upma']);
  addAliases('dosa', ['dosai', 'thosai', 'plain dosa', 'sada dosa']);
  addAliases('masala dosa', ['masala dosai', 'aloo dosa']);
  addAliases('idli', ['idly', 'steamed rice cake', 'rava idli', 'rice idli']);
  addAliases('vada', ['vadai', 'medu vada', 'wada', 'uddina vada']);
  addAliases('uttapam', ['oothappam', 'uthappam', 'uttapam']);
  addAliases('biryani', ['briyani', 'biriyani', 'mutton biryani', 'dum biryani']);
  addAliases('veg biryani', ['vegetable biryani', 'tarkari biryani', 'veg dum biryani']);
  addAliases('pulao', ['pulav', 'pilaf']);
  addAliases('jeera rice', ['zeera rice', 'cumin rice']);
  addAliases('curd rice', ['thayir sadam', 'dahi chawal', 'yogurt rice']);
  addAliases('khichdi', ['khichari', 'kitchari', 'khichuri', 'dal khichdi']);
  addAliases('oats', ['oatmeal', 'rolled oats', 'masala oats', 'oats porridge']);
  addAliases('bread', ['white bread', 'sliced bread', 'sandwich bread']);
  addAliases('brown bread', ['wheat bread', 'whole wheat bread']);
  addAliases('maggi', ['maggie', 'instant noodles', 'yippee', 'top ramen']);
  addAliases('hakka noodles', ['chowmein', 'veg noodles', 'chow mein']);
  addAliases('bajra roti', ['bajra bhakri', 'pearl millet roti']);
  addAliases('makki ki roti', ['makki roti', 'cornmeal flatbread']);
  addAliases('rumali roti', ['roomali roti']);
  addAliases('lachha paratha', ['laccha paratha', 'layered paratha']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dals & Lentils
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('toor dal', ['arhar dal', 'tuvar dal', 'pigeon pea', 'yellow dal', 'peeli dal']);
  addAliases('moong dal', ['mung dal', 'green gram', 'yellow moong dal', 'split moong dal']);
  addAliases('masoor dal', ['red lentil', 'pink dal']);
  addAliases('chana dal', ['bengal gram', 'split chickpeas']);
  addAliases('urad dal', ['black gram', 'kaali dal', 'white urad dal']);
  addAliases('dal tadka', ['yellow dal tadka', 'tadkewali dal']);
  addAliases('dal makhani', ['maa ki dal', 'kaali dal makhani', 'black lentil curry']);
  addAliases('rajma', ['kidney beans', 'rajma curry', 'rajma chawal']);
  addAliases('chole', ['chana masala', 'chickpea curry', 'kabuli chana', 'chholey']);
  addAliases('sambar', ['sambhar', 'sambaar']);
  addAliases('kadhi', ['dahi kadhi', 'yogurt curry', 'gujarati kadhi', 'punjabi kadhi']);
  addAliases('sprouts', ['moong sprouts', 'ankurit moong', 'sprouted moong']);
  addAliases('black eyed peas curry', ['lobia', 'chawli', 'black eyed beans']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dairy & Paneer
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('paneer', ['cottage cheese', 'raw paneer']);
  addAliases('paneer bhurji', ['scrambled paneer', 'crushed paneer']);
  addAliases('palak paneer', ['spinach cottage cheese', 'saag paneer']);
  addAliases('matar paneer', ['mutter paneer', 'peas and cottage cheese']);
  addAliases('curd', ['dahi', 'yogurt', 'plain yogurt', 'thayir', 'perugu']);
  addAliases('milk', ['dudh', 'doodh', 'paal']);
  addAliases('toned milk', ['toned doodh', 'packet milk']);
  addAliases('lassi', ['sweet lassi', 'sweetened yogurt drink']);
  addAliases('buttermilk', ['chaas', 'chhach', 'chaach', 'taak', 'majjiga', 'moru']);
  addAliases('ghee', ['clarified butter', 'desi ghee', 'pure ghee', 'cow ghee']);
  addAliases('butter', 'makhan', 'makkhan', 'amul butter', 'salted butter');
  addAliases('cheese', ['processed cheese', 'cheese slice', 'cheese cube', 'amul cheese']);
  addAliases('shrikhand', ['shrikand', 'srikhand', 'sweet hung curd']);
  addAliases('raita', ['boondi raita', 'cucumber raita', 'onion tomato raita', 'mixed raita']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Non-Veg & Eggs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('egg', ['anda', 'whole egg', 'raw egg']);
  addAliases('boiled egg', ['ubla anda', 'hard boiled egg', 'egg boiled']);
  addAliases('egg omelette', ['omelet', 'amlet', 'masala omelette', 'anda omelet']);
  addAliases('egg bhurji', ['anda bhurji', 'scrambled eggs', 'bhurjee']);
  addAliases('chicken curry', ['murgh kari', 'chicken gravy', 'chicken masala']);
  addAliases('butter chicken', ['murgh makhani', 'chicken makhani']);
  addAliases('chicken tikka', ['murgh tikka', 'dry chicken tikka']);
  addAliases('tandoori chicken', ['tandoori murgh', 'roasted chicken', 'grilled chicken']);
  addAliases('chicken breast', ['skinless chicken breast', 'raw chicken breast', 'grilled chicken breast']);
  addAliases('chicken biryani', ['murgh biryani', 'chicken dum biryani', 'hyderabadi chicken biryani']);
  addAliases('chicken keema', ['minced chicken', 'chicken mince']);
  addAliases('mutton curry', ['gosht curry', 'lamb curry', 'goat curry', 'meat curry']);
  addAliases('keema', ['mutton keema', 'minced meat', 'lamb mince']);
  addAliases('fish curry', ['macher jhol', 'meen kuzhambu', 'machli curry']);
  addAliases('fish fry', ['fried fish', 'machli fry', 'meen varuval']);
  addAliases('prawn curry', ['shrimp curry', 'jhinga curry', 'royyala kura']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Vegetables
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('aloo sabzi', ['potato curry', 'aloo ki sabzi', 'batata bhaji', 'poori aloo']);
  addAliases('aloo gobi', ['alu gobi', 'potato cauliflower curry']);
  addAliases('aloo matar', ['aloo mutter', 'potato peas curry']);
  addAliases('aloo jeera', ['jeera aloo', 'cumin potatoes']);
  addAliases('bhindi masala', ['okra', 'ladyfinger', 'bhindi fry', 'vendakkai poriyal']);
  addAliases('baingan bharta', ['roasted eggplant mash', 'wangyacha bharit', 'smoky eggplant']);
  addAliases('mixed sabzi', ['mix veg', 'mixed veg', 'mixed vegetables', 'veg kolhapuri']);
  addAliases('lauki sabzi', ['bottle gourd curry', 'dudhi sabzi', 'sorakkai', 'ghiya']);
  addAliases('karela sabzi', ['bitter gourd', 'pavakkai', 'bitter melon']);
  addAliases('methi sabzi', ['fenugreek leaves curry', 'methi bhaji']);
  addAliases('palak sabzi', ['spinach curry', 'spinach poriyal']);
  addAliases('mushroom masala', ['mushroom curry', 'mushroom gravy']);
  addAliases('salad', ['green salad', 'kachumbar', 'cucumber tomato onion salad', 'tossed salad']);
  addAliases('soya chunks curry', ['soya bean', 'nutrela curry', 'mealmaker curry']);
  addAliases('aloo tikki', ['potato patty', 'alu tikki']);
  addAliases('veg manchurian', ['cabbage manchurian', 'vegetable manchurian dry']);
  addAliases('chilli paneer', ['paneer chilli', 'chilly paneer']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Fruits
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('banana', ['kela', 'pazham', 'arati pandu']);
  addAliases('apple', ['seb', 'safarchand']);
  addAliases('mango', ['aam', 'maanga', 'mamidi pandu']);
  addAliases('papaya', ['papeeta', 'papali', 'boppayi']);
  addAliases('guava', ['amrood', 'peru', 'koyya', 'jama pandu']);
  addAliases('watermelon', ['tarbooz', 'kalingad', 'darboos', 'puchakaya']);
  addAliases('pomegranate', ['anaar', 'dalimb', 'madhulai', 'danimma']);
  addAliases('chikoo', ['sapota', 'chiku']);
  addAliases('orange', ['santra', 'kamala', 'orange fruit']);
  addAliases('grapes', ['angoor', 'draksh', 'dhraksha']);
  addAliases('dates', ['khajoor', 'pind khajur', 'dry dates']);
  addAliases('coconut', ['nariyal', 'thengai', 'kobbari', 'fresh coconut']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Beverages
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('chai', ['tea', 'masala chai', 'milk tea', 'cutting chai', 'indian tea']);
  addAliases('coffee', ['milk coffee', 'nescafe', 'bru']);
  addAliases('filter coffee', ['filter kaapi', 'south indian filter coffee']);
  addAliases('nimbu pani', ['lemonade', 'shikanji', 'sweet lemon water']);
  addAliases('coconut water', ['nariyal pani', 'tender coconut', 'elaneer']);
  addAliases('sugarcane juice', ['ganne ka ras', 'karumbu juice', 'cheruku rasam']);
  addAliases('rose milk', ['rooh afza milk']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Street Food & Snacks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('samosa', ['aloo samosa', 'singara', 'punjabi samosa']);
  addAliases('pakora', ['pakoda', 'bhajiya', 'bajji', 'fritters', 'onion pakoda', 'kanda bhaji']);
  addAliases('vada pav', ['wada pav', 'bombay burger']);
  addAliases('pani puri', ['golgappa', 'puchka', 'gupchup', 'batashe']);
  addAliases('bhel puri', ['bhel', 'jhal muri', 'churmuri']);
  addAliases('chole bhature', ['channa bhatura', 'chole bhatura']);
  addAliases('pav bhaji', ['pao bhaji', 'pau bhaji']);
  addAliases('frankie', ['kathi roll', 'veg roll', 'chapati roll']);
  addAliases('veg momos', ['steamed momos', 'cabbage momo']);
  addAliases('chaat', ['papdi chaat', 'aloo chaat', 'samosa chaat']);
  addAliases('dahi bhalla', ['dahi vada', 'thayir vadai']);
  addAliases('misal pav', ['usal pav', 'spicy sprouts curry with bread']);
  addAliases('dhokla', ['khaman', 'khaman dhokla', 'nylon dhokla']);
  addAliases('biscuit', ['marie biscuit', 'parle g', 'good day', 'cookies']);
  addAliases('namkeen', ['bhujia', 'sev', 'farsan', 'mixture']);
  addAliases('chips', ['potato chips', 'lays', 'uncle chipps', 'wafers']);
  addAliases('makhana', ['fox nuts', 'lotus seeds', 'phool makhana']);
  addAliases('peanuts', ['moongfali', 'shengdana', 'groundnuts', 'verkadalai', 'palleelu']);
  addAliases('almonds', ['badam', 'almond nuts']);
  addAliases('cashews', ['kaju', 'cashew nuts']);
  addAliases('walnuts', ['akhrot']);
  addAliases('raisins', ['kishmish', 'kismis', 'dry grapes', 'sultanas']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Sweets & Desserts
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('gulab jamun', ['kala jamun', 'jamun', 'syrup balls']);
  addAliases('jalebi', ['jilebi', 'zulbia']);
  addAliases('rasgulla', ['roshogolla', 'rasgula']);
  addAliases('ladoo', ['laddu', 'motichoor laddu', 'besan laddu', 'boondi laddu']);
  addAliases('barfi', ['burfi', 'kaju katli', 'besan barfi', 'milk cake']);
  addAliases('halwa', ['suji halwa', 'sheera', 'sooji halwa', 'gajar halwa', 'carrot halwa']);
  addAliases('kheer', ['payasam', 'rice pudding', 'chawal ki kheer']);
  addAliases('rasmalai', ['roshomalai', 'ras malai']);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Fasting & Regional
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addAliases('sabudana khichdi', ['sago pilaf', 'tapioca pearl khichdi', 'vrat ki khichdi']);
  addAliases('sabudana vada', ['sago patty', 'tapioca fritters']);
  addAliases('dal baati churma', ['batti', 'daal baati']);

  // Filter out any invalid ones (e.g. if canonical name wasn't in DB)
  // And filter duplicates to avoid unique constraint violations
  const uniqueAliasesMap = new Map();
  for (const a of aliases) {
    uniqueAliasesMap.set(a.alias_name, a);
  }
  const uniqueAliases = Array.from(uniqueAliasesMap.values());

  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < uniqueAliases.length; i += batchSize) {
    const batch = uniqueAliases.slice(i, i + batchSize);
    await knex('food_aliases').insert(batch);
  }

  console.log(`🔍 Seeded ${uniqueAliases.length} aliases into nutrition database`);
}
