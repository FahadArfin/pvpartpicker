export function comparisonRequest(value:unknown):string[]{
 const ids=(value as {productIds?:unknown}|null)?.productIds;
 if(!Array.isArray(ids)||ids.length<1||ids.length>4||ids.some(id=>typeof id!=='string'||!id||id.length>180)||new Set(ids).size!==ids.length)throw new Error('Select one to four unique product IDs.');
 return ids;
}
