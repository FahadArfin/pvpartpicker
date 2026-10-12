import type {Product,SpecificationIdentity,Category,Specs} from './types.ts';

// Independently reviewed selected-sale roles, 2026-10-12 batch fifteen.
// Exact names (including the UTF-8 fullwidth parenthesis) and variant URLs are intentional.
// Merchant Default Title/null SKU is proof context; catalog SKU is the selected variant ID.
const roles:readonly {id:string;identity:SpecificationIdentity;destination:{category:Category;specs:Specs};offer:{id:string;retailerId:string;url:string;sku:string}}[]=[
  {
    "id": "yixiang-power-50926959460645",
    "identity": {
      "name": "YIXIANG DIY Box Lifepo4 Battery Case Accessory Insect Net for Dust and Mosquito Repellent",
      "sourceUrl": "https://yixiangpower.com/products/yixiang-diy-box-lifepo4-battery-case-accessory-insect-net-for-dust-and-mosquito-repellent?variant=50926959460645",
      "category": "batteries",
      "anchors": {
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "accessories",
      "specs": {
        "accessoryType": "Other accessories"
      }
    },
    "offer": {
      "id": "yixiang-power-50926959460645",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/yixiang-diy-box-lifepo4-battery-case-accessory-insect-net-for-dust-and-mosquito-repellent?variant=50926959460645",
      "sku": "50926959460645"
    }
  },
  {
    "id": "yixiang-power-51143758217509",
    "identity": {
      "name": "US Stock 25.6V 280Ah 314Ah Diy Box JK BMS 8S 24V Battery Case Lifepo4 Battery Box (China's inventory :25-35 days)",
      "sourceUrl": "https://yixiangpower.com/products/us-stock-25-6v-280ah-314ah-diy-box-24v-battery-case-lifepo4-battery-case-24v-lifepo4-battery-case-with-8s-box-stack-type-without-cells?variant=51143758217509",
      "category": "batteries",
      "anchors": {
        "voltage": 25.6,
        "capacityAh": 280,
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "batteries",
      "specs": {
        "batteryKind": "Battery cabinets"
      }
    },
    "offer": {
      "id": "yixiang-power-51143758217509",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/us-stock-25-6v-280ah-314ah-diy-box-24v-battery-case-lifepo4-battery-case-24v-lifepo4-battery-case-with-8s-box-stack-type-without-cells?variant=51143758217509",
      "sku": "51143758217509"
    }
  },
  {
    "id": "yixiang-power-51399984742693",
    "identity": {
      "name": "US Stock 16kwh Lifepo4 Battery Case Bottom Trolley Rolling Base+Wheels Battery Rack Accessories",
      "sourceUrl": "https://yixiangpower.com/products/us-stock-lifepo4-battery-case-bottom-trolley-rolling-base-battery-rack-accessoriesus-stock-estimated-shipping-time-nov-15th?variant=51399984742693",
      "category": "batteries",
      "anchors": {
        "capacityKwh": 16,
        "batteryKind": "Battery modules",
        "formFactor": "Server rack",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "accessories",
      "specs": {
        "accessoryType": "Battery bases & stands"
      }
    },
    "offer": {
      "id": "yixiang-power-51399984742693",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/us-stock-lifepo4-battery-case-bottom-trolley-rolling-base-battery-rack-accessoriesus-stock-estimated-shipping-time-nov-15th?variant=51399984742693",
      "sku": "51399984742693"
    }
  },
  {
    "id": "yixiang-power-51543300866341",
    "identity": {
      "name": "MB56 Box Lifepo4 Battery Case Bottom Trolley Rolling Base+Wheels MB56 Battery Rack Accessories",
      "sourceUrl": "https://yixiangpower.com/products/china-mb56-box-lifepo4-battery-case-bottom-trolley-rolling-base-mb56-battery-rack-accessories?variant=51543300866341",
      "category": "batteries",
      "anchors": {
        "batteryKind": "Battery modules",
        "formFactor": "Server rack",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "accessories",
      "specs": {
        "accessoryType": "Battery bases & stands"
      }
    },
    "offer": {
      "id": "yixiang-power-51543300866341",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/china-mb56-box-lifepo4-battery-case-bottom-trolley-rolling-base-mb56-battery-rack-accessories?variant=51543300866341",
      "sku": "51543300866341"
    }
  },
  {
    "id": "yixiang-power-50779021705509",
    "identity": {
      "name": "YIXIANG New Vertical JK BMS DIY Battery Box Kit(US Stock: Mid-Oct)+16PCS EVE 314AH Brand New Grade A Lifepo4 Battery Cell(China's inventory :25-35 days)",
      "sourceUrl": "https://yixiangpower.com/products/yixiang-vertical-15kw-diy-lithium-battery-box-kitus-stock-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellchina-stock?variant=50779021705509",
      "category": "batteries",
      "anchors": {
        "capacityAh": 314,
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "kits",
      "specs": {
        "kitType": "Battery DIY kit"
      }
    },
    "offer": {
      "id": "yixiang-power-50779021705509",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/yixiang-vertical-15kw-diy-lithium-battery-box-kitus-stock-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellchina-stock?variant=50779021705509",
      "sku": "50779021705509"
    }
  },
  {
    "id": "yixiang-power-50832511140133",
    "identity": {
      "name": "YIXIANG V3 Stacked Battery Box Kit With JK 200A BMS (US Stock shipping time:Early November)+16PCS EVE 314 MB31 Brand New Grade A Lifepo4 Battery Cell(US Stock shipping time:Mid-Oct)",
      "sourceUrl": "https://yixiangpower.com/products/pre-sale-yixiang-pre-assembled-stacked-15kw-diy-lithium-battery-box-kitus-stock-estimated-shipping-time-aug-28th-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellchina-stock?variant=50832511140133",
      "category": "batteries",
      "anchors": {
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "kits",
      "specs": {
        "kitType": "Battery DIY kit"
      }
    },
    "offer": {
      "id": "yixiang-power-50832511140133",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/pre-sale-yixiang-pre-assembled-stacked-15kw-diy-lithium-battery-box-kitus-stock-estimated-shipping-time-aug-28th-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellchina-stock?variant=50832511140133",
      "sku": "50832511140133"
    }
  },
  {
    "id": "yixiang-power-50995063718181",
    "identity": {
      "name": "YIXIANG New Vertical JK BMS DIY Battery Box Kit(US Stock: Oct-8th )+16Pcs YIXIANG 314AH Brand New Grade a Lifepo4 Battery(China's inventory :25-35 days )",
      "sourceUrl": "https://yixiangpower.com/products/yixiang-diy-vertical-battery-box-kit-with-jk-200a-bmsus-stock-estimated-shipping-time-sept-28th-16pcs-314ah-brand-new-grade-a-lifepo4-batterychina-stock?variant=50995063718181",
      "category": "batteries",
      "anchors": {
        "capacityAh": 314,
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "kits",
      "specs": {
        "kitType": "Battery DIY kit"
      }
    },
    "offer": {
      "id": "yixiang-power-50995063718181",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/yixiang-diy-vertical-battery-box-kit-with-jk-200a-bmsus-stock-estimated-shipping-time-sept-28th-16pcs-314ah-brand-new-grade-a-lifepo4-batterychina-stock?variant=50995063718181",
      "sku": "50995063718181"
    }
  },
  {
    "id": "yixiang-power-50995125649701",
    "identity": {
      "name": "YIXIANG V3 DIY Horizontal Battery Box Kit with JK 200A BMS（US Stock shipping time:Early November) +16Pcs YIXIANG 314AH Brand New Grade a Lifepo4 Battery(China's inventory :25-35 days)",
      "sourceUrl": "https://yixiangpower.com/products/yixiang-v2-diy-horizontal-battery-box-kit-with-jk-200a-bmsus-stock-estimated-shipping-time-aug-28th-16pcs-314ah-brand-new-grade-a-lifepo4-batterychina-stock?variant=50995125649701",
      "category": "batteries",
      "anchors": {
        "capacityAh": 314,
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "kits",
      "specs": {
        "kitType": "Battery DIY kit"
      }
    },
    "offer": {
      "id": "yixiang-power-50995125649701",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/yixiang-v2-diy-horizontal-battery-box-kit-with-jk-200a-bmsus-stock-estimated-shipping-time-aug-28th-16pcs-314ah-brand-new-grade-a-lifepo4-batterychina-stock?variant=50995125649701",
      "sku": "50995125649701"
    }
  },
  {
    "id": "yixiang-power-51223113826597",
    "identity": {
      "name": "YIXIANG S2 Vertical JK BMS DIY Battery Box Kit(US Stock: Oct-8th )+16PCS EVE 314 MB31 Grade A Lifepo4 Battery Cell(US Stock :Mid-Oct)",
      "sourceUrl": "https://yixiangpower.com/products/pre-sale-yixiang-pre-assembled-vertical-v19-bms-diy-lithium-battery-box-kitus-stock-estimated-shipping-time-oct-7th-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellin-stock-at-us-warehouse-shipping-time-3-5-days?variant=51223113826597",
      "category": "batteries",
      "anchors": {
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "kits",
      "specs": {
        "kitType": "Battery DIY kit"
      }
    },
    "offer": {
      "id": "yixiang-power-51223113826597",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/pre-sale-yixiang-pre-assembled-vertical-v19-bms-diy-lithium-battery-box-kitus-stock-estimated-shipping-time-oct-7th-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellin-stock-at-us-warehouse-shipping-time-3-5-days?variant=51223113826597",
      "sku": "51223113826597"
    }
  },
  {
    "id": "yixiang-power-51223192011045",
    "identity": {
      "name": "YIXIANG Stacked V3 JK BMS DIY Battery Box Kit(US Stock shipping time:Early November)+16PCS EVE 314AH Brand New Grade A Lifepo4 Battery Cell(China Inventory: 25-35 days)",
      "sourceUrl": "https://yixiangpower.com/products/yixiang-pre-assembled-stacked-v19-bms-diy-lithium-battery-box-kitin-stock-at-us-warehouse-shipping-time-3-5-days-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellin-china-the-shipping-time-is-25-35-days?variant=51223192011045",
      "category": "batteries",
      "anchors": {
        "capacityAh": 314,
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "kits",
      "specs": {
        "kitType": "Battery DIY kit"
      }
    },
    "offer": {
      "id": "yixiang-power-51223192011045",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/yixiang-pre-assembled-stacked-v19-bms-diy-lithium-battery-box-kitin-stock-at-us-warehouse-shipping-time-3-5-days-16pcs-eve-314ah-brand-new-grade-a-lifepo4-battery-cellin-china-the-shipping-time-is-25-35-days?variant=51223192011045",
      "sku": "51223192011045"
    }
  },
  {
    "id": "yixiang-power-53699881271589",
    "identity": {
      "name": "YIXIANG WIFI BMS Stacked Battery Box Kit With YX 200A BMS (US Stock shipping time: 3~7 Days)+16PCS EVE 314 MB31 Brand New Grade A Lifepo4 Battery Cell(US Stock shipping time: Mid-Oct)",
      "sourceUrl": "https://yixiangpower.com/products/yixiang-v3-stacked-battery-box-kit-with-yx-200a-bms-us-stock-shipping-time-3-7-days-16pcs-eve-314-mb31-brand-new-grade-a-lifepo4-battery-cellus-stock-shipping-time-3-7-days?variant=53699881271589",
      "category": "batteries",
      "anchors": {
        "batteryKind": "Battery modules",
        "chemistry": "LiFePO4"
      }
    },
    "destination": {
      "category": "kits",
      "specs": {
        "kitType": "Battery DIY kit"
      }
    },
    "offer": {
      "id": "yixiang-power-53699881271589",
      "retailerId": "yixiang-power",
      "url": "https://yixiangpower.com/products/yixiang-v3-stacked-battery-box-kit-with-yx-200a-bms-us-stock-shipping-time-3-7-days-16pcs-eve-314-mb31-brand-new-grade-a-lifepo4-battery-cellus-stock-shipping-time-3-7-days?variant=53699881271589",
      "sku": "53699881271589"
    }
  }
];

function metadataRole(product:Pick<Product,'id'|'name'|'sourceUrl'|'category'|'specs'>){
 const role=roles.find(r=>r.id===product.id);
 if(!role||product.name!==role.identity.name||product.sourceUrl!==role.identity.sourceUrl)return;
 const applied=product.category===role.destination.category&&Object.entries(role.destination.specs).every(([key,value])=>product.specs[key]===value);
 if(!applied&&product.category!==role.identity.category)return;
 for(const [key,value] of Object.entries(role.identity.anchors)){
  const expected=applied&&key in role.destination.specs?role.destination.specs[key]:value;
  if(product.specs[key]!==expected)return;
 }
 // Explicit role scalars (including owner overrides) are never overwritten on mismatch.
 for(const [key,value] of Object.entries(role.destination.specs)){
  if(!(key in role.identity.anchors)&&product.specs[key]!==undefined&&product.specs[key]!==value)return;
 }
 return {role,applied};
}

export function isReviewedStorageRoleCandidate(product:Pick<Product,'id'|'name'|'sourceUrl'|'category'|'specs'>):boolean{return !!metadataRole(product);}

/** Undefined means hold: changed identity, selection, raw anchors or prior evidence. */
export function applyReviewedStorageRole(product:Product):Product|undefined{
 const match=metadataRole(product);if(!match)return;
 // An old-category specification needs explicit provenance-aware migration first.
 if(product.specification)return;
 const {role,applied}=match;
 if(product.offers.length!==1)return;
 const offer=product.offers[0];
 if(offer.id!==role.offer.id||offer.retailerId!==role.offer.retailerId||offer.url!==role.offer.url||offer.sku!==role.offer.sku)return;
 return applied?product:{...product,category:role.destination.category,specs:{...product.specs,...role.destination.specs}};
}
