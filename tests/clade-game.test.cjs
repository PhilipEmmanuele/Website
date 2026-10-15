// Run with: node --test tests/clade-game.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('static/clade-game.html', 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx = vm.createContext({ResizeObserver: class { observe() {} }, document: {body: {}}, console});
vm.runInContext(js, ctx);
const run = code => vm.runInContext(code, ctx);
test('every animal and alias has a valid lineage, with derived depths', () => {
 assert.equal(run('SPECIES.length'), 69);
 assert.ok(run('SPECIES.every(s => ANCESTORS[s.clade] && getAncestorChain(s.clade).at(-1) === "Metazoa")'));
 assert.ok(run('Object.values(ALIASES).every(k => !!ANCESTORS[k])'));
 assert.ok(run('Object.values(ANCESTORS).every(n => !n.parent || n.depth === ANCESTORS[n.parent].depth + 1)'));
 assert.equal(run('SPECIES.some(s => s.taxon.includes(" sp."))'), false);
});
test('regressions for missing clades and misleading aliases', () => {
 const pairs = [
 ['Dog','Polar Bear','Caniformia'], ['Human','Baboon','Catarrhini'],
 ['Lion','Tiger','Panthera'], ['Human','Chimpanzee','Hominini'],
 ['Cow','Red Deer','Pecora'], ['Goat','Sheep','Caprinae'],
 ['Lobster','Crab','Decapoda'], ['Honeybee','Red Wood Ant','Aculeata'], ['Honeybee','Painted Lady','Holometabola'],
 ['Chicken','Grey Parrot','Neognathae'], ['Komodo Dragon','Ball Python','Squamata'],
 ['Garden Snail','Earthworm','Lophotrochozoa'], ['Human','Octopus','Bilateria'],
 ['Crocodile','Chicken','Archosauria']];
 for (const [a,b,want] of pairs) {
   assert.equal(run(`findLCA(SPECIES.find(s=>s.name===${JSON.stringify(a)}), SPECIES.find(s=>s.name===${JSON.stringify(b)}))`), want, `${a} + ${b}`);
 }
 for (const word of ['fish','worms','bugs','ungulates','monkeys','crustaceans']) assert.equal(run(`ALIASES[${JSON.stringify(word)}]`), undefined, word);
 assert.equal(run('ALIASES.apes'), 'Hominoidea');
});
test('all generated pairs have symmetric shared ancestors and sensible feedback', () => {
 run('precomputePairs()');
 assert.equal(run('ALL_PAIRS.length'), run('SPECIES.length * (SPECIES.length - 1) / 2'));
 assert.ok(run(`ALL_PAIRS.every(p => {
 const a = SPECIES[p.i], b = SPECIES[p.j];
 return findLCA(a,b) === findLCA(b,a) && getAncestorChain(a.clade).includes(p.lca) && getAncestorChain(b.clade).includes(p.lca) && evaluateGuess(p.lca,p.lca,a,b).result === 'correct';
 })`));
 assert.equal(run(`evaluateGuess('Mammalia','Carnivora',SPECIES.find(s=>s.name==='Dog'),SPECIES.find(s=>s.name==='House Cat')).result`),'too_far_back');
 assert.equal(run(`evaluateGuess('Canidae','Carnivora',SPECIES.find(s=>s.name==='Dog'),SPECIES.find(s=>s.name==='House Cat')).result`),'too_close');
});
test('sampling avoids repeat pairs and recent answers in a session', () => {
 run('state.usedPairs.clear(); state.recentAnswers = []');
 const names = new Set(); const answers = [];
 for (let i=0; i<100; i++) {
  const pair = run('pickPair()'); const key = [pair.sp1.name,pair.sp2.name].sort().join('|');
  assert.ok(!names.has(key)); names.add(key);
  assert.ok(!answers.slice(-3).includes(pair.lca)); answers.push(pair.lca);
 }
});
test('study examples and transfer questions agree with the game taxonomy', () => {
 assert.equal(run('STUDY_LESSONS.length'),8);
 assert.ok(run(`STUDY_LESSONS.every(lesson => {
  const example = getStudyPair(lesson.example), practice = getStudyPair(lesson.practice);
  return example.every(Boolean) && practice.every(Boolean) && findLCA(...example) === lesson.key && findLCA(...practice) === lesson.key && [...lesson.example].sort().join('|') !== [...lesson.practice].sort().join('|');
 })`));
});
test('Easy allows a description naming one animal, but never both', () => {
 assert.equal(run(`easyDescriptionFits('Bovidae', SPECIES.find(s=>s.name==='Cow'), SPECIES.find(s=>s.name==='Goat'))`),false);
 assert.equal(run(`easyDescriptionFits('Bovidae', SPECIES.find(s=>s.name==='Cow'), SPECIES.find(s=>s.name==='Red Deer'))`),true);
 assert.equal(run(`easyDescriptionFits('Canidae', SPECIES.find(s=>s.name==='Dog'), SPECIES.find(s=>s.name==='Wolf'))`),true);
 assert.equal(run(`easyDescriptionFits('Ursus', SPECIES.find(s=>s.name==='Grizzly Bear'), SPECIES.find(s=>s.name==='Polar Bear'))`),false);
 assert.equal(run(`easyDescriptionFits('Aculeata', SPECIES.find(s=>s.name==='Honeybee'), SPECIES.find(s=>s.name==='Red Wood Ant'))`),false);
 assert.ok(run(`eligiblePairs('easy').every(p=>easyDescriptionFits(p.lca,SPECIES[p.i],SPECIES[p.j]))`));
 assert.ok(run(`eligiblePairs('easy').length > 100`));
 assert.equal(run(`eligiblePairs('medium').length`),run('ALL_PAIRS.length'));
 run(`state.mode='easy';state.usedPairs = new Set(eligiblePairs('easy').map(p=>[SPECIES[p.i].name,SPECIES[p.j].name].sort().join('|')))`);
 const pair = run('pickPair()');
 assert.ok(run(`easyDescriptionFits(${JSON.stringify(pair.lca)},SPECIES.find(s=>s.name===${JSON.stringify(pair.sp1.name)}),SPECIES.find(s=>s.name===${JSON.stringify(pair.sp2.name)}))`));
});
test('every eligible Easy pair has four distinct options, none naming both animals', () => {
 assert.ok(run(`eligiblePairs('easy').every(p => {
  const a=SPECIES[p.i], b=SPECIES[p.j], choices=easyChoices(p.lca,a,b);
  return choices.length===4 && new Set(choices).size===4 && choices.includes(p.lca) && choices.every(k=>easyDescriptionFits(k,a,b));
 })`));
});
test('relationship map layouts preserve every visible edge without overlapping cards', () => {
 for (const root of run('Object.keys(ANCESTORS)')) for (const levels of [1,2,3,4,5,30]) {
  const layout=run(`relationshipLayout(${JSON.stringify(root)},${levels})`);
  assert.equal(new Set(layout.nodes.map(n=>n.key)).size,layout.nodes.length);
  assert.equal(layout.edges.length,layout.nodes.length-1);
  for(const {from,to} of layout.edges){
   assert.equal(run(`ANCESTORS[${JSON.stringify(to.key)}].parent`),from.key);
   assert.ok(to.y>=from.y+from.height);
  }
  for(let i=0;i<layout.nodes.length;i++)for(let j=i+1;j<layout.nodes.length;j++){
   const a=layout.nodes[i],b=layout.nodes[j];
   if(a.y===b.y)assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2);
  }
 }
});

test('all-level layout includes every clade from the root', () => {
 assert.equal(run("relationshipLayout('Metazoa',30).nodes.length"),run('Object.keys(ANCESTORS).length'));
});
