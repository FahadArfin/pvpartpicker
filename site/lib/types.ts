export type Category = 'panels' | 'mounting' | 'wiring' | 'batteries' | 'all-in-one' | 'inverters' | 'charging' | 'module-electronics' | 'monitoring' | 'kits' | 'electrical' | 'accessories';
export type Specs = Record<string, string | number | boolean>;
export interface Offer { id: string; retailerId: string; retailer: string; url: string; price: number; referencePrice?:number; currency: 'USD'; packQuantity: number; stock: 'in_stock' | 'out_of_stock' | 'unknown'; observedAt: string; sku?: string; shipping?: number; condition: 'new' | 'used'; }
export interface SpecificationSource { url: string; kind: 'datasheet' | 'manual' | 'manufacturer' | 'retailer' | 'listing'; label: string; model?: string; checkedAt?: string; }
export interface SpecificationField { key: string; label: string; value: string; source: string; kind?: SpecificationSource['kind']; }
export interface ProductSpecification { summary: string; groups: {title: string; fields: SpecificationField[]}[]; sources: SpecificationSource[]; notes: string[]; panelRatings?: {stc: Record<string,string>; noct: Record<string,string>; noctLabel?: string; sources?: Record<string,string>}; }
export type BundleComponentType = 'power-station' | 'panels' | 'batteries' | 'inverter' | 'mounting' | 'controls' | 'charging' | 'accessories';
export interface BundleComponent {type:BundleComponentType;quantity?:number;detail:string;}
export interface ProductConfiguration {kind:'combo'|'standalone';title:string;family:string;selection:string;type:string;components:BundleComponent[];}
export interface Product { id: string; name: string; brand: string; category: Category; description: string; image: string; images: string[]; sourceUrl: string; documentation?: string; specification?: ProductSpecification; connectionSpecs?:Record<string,SpecificationField>; comparisonSpecs?:Record<string,{value:string;source?:string;note?:string}>; configuration?:ProductConfiguration; specs: Specs; offers: Offer[]; verifiedAt: string; }
export interface BuildLine { productId: string; quantity: number; offerId?: string; }
export interface PVArray {id:string;panelId:string;receiverId?:string;receiverUnit:number;tracker:number;series:number;parallel:number;batteryId?:string;}
export interface BuildSettings { analytics?:import("./build-analytics").AnalyticsSettings; purpose: 'offgrid' | 'hybrid' | 'gridtie'; mount: 'roof' | 'ground'; series?: number; parallel?: number; minimumTemperature?: number; maximumCellTemperature?:number; pvArrays?:PVArray[]; }
export interface Build { id?: string; name: string; lines: BuildLine[]; settings: BuildSettings; shareId?: string; }
export interface Compatibility { status: 'match' | 'mismatch' | 'unknown'; title: string; detail: string; source?: string; }
export interface Observation { packQuantity?:number; offerId: string; price: number; stock: string; observedAt: string; sourceId?:string;sourceLabel?:string;sourceUrl?:string;precision?:'day'; }
export interface CollectionReport { retailerId: string; retailer: string; status: string; products: number; checkedAt: string; message?: string; }
export const categories: { id: Category; label: string; singular: string; description: string }[] = [
  { id: 'panels', label: 'Solar panels', singular: 'panel', description: 'Find the right watts, cell technology, and finish.' },
  { id: 'mounting', label: 'Mounting', singular: 'mount', description: 'Roof rails, clamps, and ground mount systems.' },
  { id: 'wiring', label: 'Wire & connectors', singular: 'wire', description: 'PV wire, battery cables, connectors, and lugs.' },
  { id: 'batteries', label: 'Batteries', singular: 'battery', description: 'Store solar energy for nights and backup.' },
  { id: 'all-in-one', label: 'All-in-one batteries', singular: 'power station', description: 'Integrated storage and charging for portable power and backup; DC-only models have no AC inverter.' },
  { id: 'inverters', label: 'Inverters', singular: 'inverter', description: 'Off-grid, hybrid, and grid-tied power conversion.' },
  { id: 'charging', label: 'Charge controllers', singular: 'charge controller', description: 'Standalone MPPT/PWM solar controllers and DC-DC chargers.' },
  { id: 'module-electronics', label: 'Shutdown & optimizers', singular: 'module device', description: 'Module optimizers, rapid-shutdown devices, and transmitters.' },
  { id: 'monitoring', label: 'Monitoring & control', singular: 'monitor or controller', description: 'Energy meters, battery shunts, smart panels, and transfer controls.' },
  { id: 'kits', label: 'Bundles & combos', singular: 'bundle', description: 'Power station combos, inverter + battery packages, and solar system kits.' },
  { id: 'electrical', label: 'Electrical', singular: 'electrical part', description: 'Protection, conduit, disconnects, and grounding.' },
  { id: 'accessories', label: 'Accessories', singular: 'accessory', description: 'Chargers, covers, adapters, and useful extras.' },
];
