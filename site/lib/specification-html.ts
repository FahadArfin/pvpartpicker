import {load} from 'cheerio';
/** Extract explicit labels/values from common retailer specification layouts. */
export function specificationRowsFromHtml(html:string,sourceUrl?:string):string[][]{
 const $=load(html);$('script,style,nav,header,footer').remove();
 let scope=$('main').first();if(!scope.length)scope=$('body');
 const clean=(s:string)=>s.replace(/\s+/g,' ').trim();const rows:string[][]=[];
 scope.find('tr').each((_,e)=>{const cells=$(e).find('th,td').toArray().map(c=>clean($(c).text()));if(cells.length>=2&&cells.length<=16&&cells[0].length<120&&cells.every(t=>t.length<400))rows.push(cells);});
 scope.find('dt').each((_,e)=>{const label=clean($(e).text()),value=clean($(e).next('dd').text());if(label&&value&&label.length<120&&value.length<400)rows.push([label,value]);});
 scope.find('.specs-item').each((_,e)=>{const label=clean($(e).find('.specs-left').text()),value=clean($(e).find('.specs-right').text());if(label&&value&&label.length<120&&value.length<400)rows.push([label,value]);});
 // Only labelled bullets inside product descriptions; never infer from sales paragraphs.
 scope.find('.about__accordion-description li, .product-description li, .woocommerce-product-details__short-description li, #tab-description li').each((_,e)=>{
  const text=clean($(e).text()),match=text.match(/^([^:：]{2,100})[:：]\s*(.+)$/);if(match&&match[2].length<400)rows.push([match[1],match[2]]);
 });
 // Manufacturer comparison cards store labels in attributes, rather than visible
 // table headings. Only cards linking to this product are admissible. Preserve
 // wattage columns; never merge an adjacent recommended product into this one.
 if(sourceUrl){
  const cards=new Map<string,Map<string,string>>();let ambiguous=false;
  scope.find('.rg-compare-blocks-content-item').each((_,e)=>{
   const link=$(e).find('.compare-learn-more-btn').attr('href');if(!link)return;
   let href:URL;try{href=new URL(link,sourceUrl);}catch{return;}
   const source=new URL(sourceUrl);if(href.origin!==source.origin||href.pathname!==source.pathname)return;
   const values=new Map<string,string>();$(e).find('[data-parameters-list] [data-parameter-name]').each((_,li)=>{const label=clean($(li).attr('data-parameter-name')||''),value=clean($(li).text());if(label&&label.length<120&&value&&value.length<400)values.set(label,value);});
   const power=values.get('Maximum Power at STC');if(!power)return;
   if(cards.has(power)&&JSON.stringify([...cards.get(power)!])!==JSON.stringify([...values])){ambiguous=true;return;}
   cards.set(power,values);
  });
  if(!ambiguous&&cards.size){const labels=new Set([...cards.values()].flatMap(v=>[...v.keys()]));for(const label of labels)rows.push([label,...[...cards.values()].map(v=>v.get(label)||'')]);}
 }
 return rows;
}
