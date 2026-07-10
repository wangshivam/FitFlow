import nutritionService from './src/services/nutrition.service.js';

async function testWorkflow() {
  console.log('=== CALORIE MATCHING WORKFLOW EXECUTION ===\n');

  // Test 1: 2 roti
  console.log('📝 INPUT: "2 roti"');
  const roti = await nutritionService.calculate('roti', 2, 'piece');
  console.log('✅ OUTPUT:');
  console.log(JSON.stringify(roti, null, 2));
  console.log('\n----------------------------------------\n');

  // Test 2: 1 bowl rajma
  console.log('📝 INPUT: "1 bowl rajma"');
  const rajma = await nutritionService.calculate('rajma', 1, 'bowl');
  console.log('✅ OUTPUT:');
  console.log(JSON.stringify(rajma, null, 2));
  console.log('\n----------------------------------------\n');

  // Test 3: 1 glass lassi
  console.log('📝 INPUT: "1 glass lassi"');
  const lassi = await nutritionService.calculate('lassi', 1, 'glass');
  console.log('✅ OUTPUT:');
  console.log(JSON.stringify(lassi, null, 2));
  console.log('\n----------------------------------------\n');
  
  // Test 4: paneer bhurji
  console.log('📝 INPUT: "paneer bhurji" (1 plate)');
  const paneer = await nutritionService.calculate('paneer bhurji', 1, 'plate');
  console.log('✅ OUTPUT:');
  console.log(JSON.stringify(paneer, null, 2));
  console.log('\n===========================================');
  
  process.exit(0);
}

testWorkflow().catch(console.error);
