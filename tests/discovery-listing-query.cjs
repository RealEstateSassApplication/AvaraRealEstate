const assert=require('node:assert/strict');const{test}=require('node:test');const fs=require('node:fs');const ts=require('typescript');
const source=fs.readFileSync('lib/discovery/listing-query.ts','utf8');
const compiled={exports:{}};new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(compiled.exports,compiled);
const{parseListingQuery,listingQuery,normalizeFilters}=compiled.exports;
test('deep links preserve filters, repeated values, page and zero budget',()=>{const q=parseListingQuery('purpose=rent&city=Nugegoda&maxPrice=0&type=house&type=apartment&verified=true&page=3');assert.equal(q.page,3);assert.equal(q.filters.maxPrice,0);assert.deepEqual(parseListingQuery(listingQuery(q.filters,q.page)),q);});
test('malformed filter values do not survive parsing',()=>{const q=parseListingQuery('purpose=invalid&minPrice=-1&maxPrice=abc&bedrooms=1.5&page=-3');assert.deepEqual(q,{filters:{},page:1});});
test('land-only filter drops bedroom requirements and mixed types preserve them',()=>{assert.deepEqual(normalizeFilters({type:['land'],bedrooms:2}),{type:['land']});assert.equal(normalizeFilters({type:['house','land'],bedrooms:2}).bedrooms,2);});
