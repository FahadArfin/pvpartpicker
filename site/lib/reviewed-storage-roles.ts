import type {Product,SpecificationIdentity,Category,Specs} from './types.ts';

// Independently reviewed selected-sale roles, 2026-10-12 batches fifteen and seventeen.
// Exact names (including the UTF-8 fullwidth parenthesis) and variant URLs are intentional.
// Merchant Default Title/null SKU is proof context; catalog SKU is the selected variant ID.
const roles:readonly {id:string;identity:SpecificationIdentity;destination:{category:Category;specs:Specs};offer:{id:string;retailerId:string;url:string;sku:string;packQuantity?:number}}[]=[
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
  ,
{
    "id": "practical-preppers-18167",
    "identity": {
      "name": "Pocket Solar Lantern – Rechargeable LED Light, Power Bank with USB Charging Port",
      "sourceUrl": "https://practicalpreppers.com/product/pocket-solar-lantern-rechargeable-led-light-power-bank/",
      "category": "all-in-one",
      "anchors": {}
    },
    "destination": {
      "category": "accessories",
      "specs": {
        "accessoryType": "Other accessories"
      }
    },
    "offer": {
      "id": "practical-preppers-18167",
      "retailerId": "practical-preppers",
      "url": "https://practicalpreppers.com/product/pocket-solar-lantern-rechargeable-led-light-power-bank/",
      "sku": "18167",
      "packQuantity": 1
    }
  },
  {
    "id": "santan-solar-deltaprorc",
    "identity": {
      "name": "EcoFlow DELTA Pro Remote Control",
      "sourceUrl": "https://www.santansolar.com/product/ecoflow-delta-pro-remote-control/",
      "category": "all-in-one",
      "anchors": {}
    },
    "destination": {
      "category": "accessories",
      "specs": {
        "accessoryType": "Displays & controls"
      }
    },
    "offer": {
      "id": "santan-solar-deltaprorc",
      "retailerId": "santan-solar",
      "url": "https://www.santansolar.com/product/ecoflow-delta-pro-remote-control/",
      "sku": "DELTAPRORC",
      "packQuantity": 1
    }
  },
  {
    "id": "shopsolar-41900354470028",
    "identity": {
      "name": "EP900 PV Inverter Energy Meter",
      "sourceUrl": "https://shopsolarkits.com/products/ep900-pv-inverter-energy-meter?variant=41900354470028",
      "category": "inverters",
      "anchors": {}
    },
    "destination": {
      "category": "monitoring",
      "specs": {
        "monitorType": "Energy monitor / meter"
      }
    },
    "offer": {
      "id": "shopsolar-41900354470028",
      "retailerId": "shopsolar",
      "url": "https://shopsolarkits.com/products/ep900-pv-inverter-energy-meter?variant=41900354470028",
      "sku": "41900354470028",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-fuse-combinerbox-15a-16",
    "identity": {
      "name": "20A Spare Fuses -Solar Panel Combiner Box of 5 pcs",
      "sourceUrl": "https://watts247.com/product/20a-spare-fuses-solar-panel-combiner-box-of-5-pcs/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Fuses"
      }
    },
    "offer": {
      "id": "watts247-fuse-combinerbox-15a-16",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/20a-spare-fuses-solar-panel-combiner-box-of-5-pcs/",
      "sku": "Fuse-CombinerBox-15A-16",
      "packQuantity": 5
    }
  },
  {
    "id": "watts247-4-2-1",
    "identity": {
      "name": "4-2 Empty Solar Panel Combiner Box – DIY your own configuration (4 in 4 out etc)",
      "sourceUrl": "https://watts247.com/product/4-2-empty-solar-panel-combiner-box-diy-your-own-configuration-4-in-4-out-etc/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-4-2-1",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/4-2-empty-solar-panel-combiner-box-diy-your-own-configuration-4-in-4-out-etc/",
      "sku": "4-2-1",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-4-4",
    "identity": {
      "name": "4-4 Solar Panel Protection Box – 4 in 4 out MPPT Inputs – (4 x 63A max output) – Ideal For 4 PV Inputs – Fuse + Surge Protection",
      "sourceUrl": "https://watts247.com/product/4-4-solar-panel-protection-box-4-in-4-out-mppt-inputs-4-x-63a-max-output-ideal-for-4-pv-inputs-fuse-surge-protection/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-4-4",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/4-4-solar-panel-protection-box-4-in-4-out-mppt-inputs-4-x-63a-max-output-ideal-for-4-pv-inputs-fuse-surge-protection/",
      "sku": "4-4",
      "packQuantity": 4
    }
  },
  {
    "id": "watts247-6-2",
    "identity": {
      "name": "6-2 Solar Panel Combiner Box -(3 into 1 twice)- (2 x 63A max output) Version 3 Improved, ltd stock.",
      "sourceUrl": "https://watts247.com/product/6-2-solar-panel-combiner-box-3-into-1-twice-63a-max-output/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-6-2",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/6-2-solar-panel-combiner-box-3-into-1-twice-63a-max-output/",
      "sku": "6-2",
      "packQuantity": 2
    }
  },
  {
    "id": "watts247-6-3-1",
    "identity": {
      "name": "6-3 Empty Solar Panel Combiner Box – DIY your own configuration (6 in 6 out etc )",
      "sourceUrl": "https://watts247.com/product/6-3-empty-solar-panel-combiner-box-diy-your-own-configuration-6-in-6-out-etc/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-6-3-1",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/6-3-empty-solar-panel-combiner-box-diy-your-own-configuration-6-in-6-out-etc/",
      "sku": "6-3-1",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-6-3v3-36",
    "identity": {
      "name": "6-3 Solar Panel Combiner Box – (2 circuits to 1) x 3 times for 3MPPT Inputs – (3 x 63A max output) – Ideal For 3 PV Inputs -Version 3 Improved",
      "sourceUrl": "https://watts247.com/product/6-3-solar-panel-combiner-box-2-circuits-to-1-x-3-times-for-3mppt-inputs-3-x-63a-max-output-ideal-for-3-pv-inputs-version-3-improved/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-6-3v3-36",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/6-3-solar-panel-combiner-box-2-circuits-to-1-x-3-times-for-3mppt-inputs-3-x-63a-max-output-ideal-for-3-pv-inputs-version-3-improved/",
      "sku": "6-3V3-36",
      "packQuantity": 3
    }
  },
  {
    "id": "watts247-6-3",
    "identity": {
      "name": "6-3 Solar Panel Combiner Box – (2 circuits to 1) x3 times for 3 MPPT Inputs – (3 x 63A max output) – Ideal For Luxpower EG4 / Sol-Ark",
      "sourceUrl": "https://watts247.com/product/6-3-solar-panel-combiner-box/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-6-3",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/6-3-solar-panel-combiner-box/",
      "sku": "6-3",
      "packQuantity": 3
    }
  },
  {
    "id": "watts247-8-4-empty",
    "identity": {
      "name": "8-4 Solar Panel Combiner Box – Empty Box ONLY",
      "sourceUrl": "https://watts247.com/product/8-4-solar-panel-combiner-box-empty-box-only/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-8-4-empty",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/8-4-solar-panel-combiner-box-empty-box-only/",
      "sku": "8-4- Empty",
      "packQuantity": 4
    }
  },
  {
    "id": "watts247-8-4",
    "identity": {
      "name": "8-4 Solar Panel Combiner Box – (2 circuits to 1) x4 times for 4 MPPT Inputs – (4 x 63A max output) – Ideal For 4 PV Inputs -Version 3 Improved",
      "sourceUrl": "https://watts247.com/product/8-4-solar-panel-combiner-box/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-8-4",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/8-4-solar-panel-combiner-box/",
      "sku": "8-4",
      "packQuantity": 4
    }
  },
  {
    "id": "watts247-w-emp-220300-2",
    "identity": {
      "name": "Dual DC-220-300V-W EMP Shield (Solar Panel DC Protection) – Ideal for LV6548 or Dual 250V Mppts",
      "sourceUrl": "https://watts247.com/product/dual-dc-220-300v-w-emp-shield-solar-panel-dc-protection/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Surge protection"
      }
    },
    "offer": {
      "id": "watts247-w-emp-220300-2",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/dual-dc-220-300v-w-emp-shield-solar-panel-dc-protection/",
      "sku": "W-EMP-220300-2",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-w-emp-600vdcx2",
    "identity": {
      "name": "Dual DC-600V-W EMP Shield (Solar Panel DC Protection) – Use on LVX6048xx and SOL-Ark models",
      "sourceUrl": "https://watts247.com/product/dual-dc-600v-w-emp-shield-solar-panel-dc-protection-use-on-lvx6048wp-and-sol-ark-models/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Surge protection"
      }
    },
    "offer": {
      "id": "watts247-w-emp-600vdcx2",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/dual-dc-600v-w-emp-shield-solar-panel-dc-protection-use-on-lvx6048wp-and-sol-ark-models/",
      "sku": "W-EMP-600Vdcx2",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-w-emp-220300",
    "identity": {
      "name": "Single DC-220-300V-W EMP Shield (Solar Panel DC Protection)",
      "sourceUrl": "https://watts247.com/product/single-dc-220-300v-w-emp-shield-solar-panel-dc-protection/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Surge protection"
      }
    },
    "offer": {
      "id": "watts247-w-emp-220300",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/single-dc-220-300v-w-emp-shield-solar-panel-dc-protection/",
      "sku": "W-EMP-220300",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-w-emp-600vdcx1",
    "identity": {
      "name": "Single DC-600V-W EMP Shield (Solar Panel DC Protection) – Use on LVX6048xx models",
      "sourceUrl": "https://watts247.com/product/single-dc-600v-w-emp-shield-solar-panel-dc-protection/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Surge protection"
      }
    },
    "offer": {
      "id": "watts247-w-emp-600vdcx1",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/single-dc-600v-w-emp-shield-solar-panel-dc-protection/",
      "sku": "W-EMP-600Vdcx1",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-4-1",
    "identity": {
      "name": "4-1 Solar Panel Combiner Box – 4 circuits to 1 (1 x 63A max output) Version 3 Improved, ltd stock.",
      "sourceUrl": "https://watts247.com/product/solar-panel-combiner-box-4-circuits-to-1/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-4-1",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/solar-panel-combiner-box-4-circuits-to-1/",
      "sku": "4-1",
      "packQuantity": 1
    }
  },
  {
    "id": "watts247-4-2",
    "identity": {
      "name": "4-2 Solar Panel Combiner Box – 4 circuits to 2 (2 to 1)- (2 x 63A max output) Version 3 Improved, ltd stock.",
      "sourceUrl": "https://watts247.com/product/solar-panel-combiner-box-4-circuits-to-2/",
      "category": "panels",
      "anchors": {}
    },
    "destination": {
      "category": "electrical",
      "specs": {
        "electricalType": "Boxes & combiners"
      }
    },
    "offer": {
      "id": "watts247-4-2",
      "retailerId": "watts247",
      "url": "https://watts247.com/product/solar-panel-combiner-box-4-circuits-to-2/",
      "sku": "4-2",
      "packQuantity": 2
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

/** Component corrections freeze recorded package selection, not commercial unit semantics. */
export function isPackageGuardedReviewedRoleCandidate(product:Pick<Product,'id'|'name'|'sourceUrl'|'category'|'specs'>):boolean{return metadataRole(product)?.role.offer.packQuantity!==undefined;}

/** ID alone may retain a rejection; it never authorizes a category correction. */
export function isPackageGuardedReviewedRoleListing(product:Pick<Product,'id'>):boolean{return roles.some(role=>role.id===product.id&&role.offer.packQuantity!==undefined);}

/** Preserve the original storage override boundary; component roles use their own role fields. */
export function hasReviewedRoleOverride(product:Pick<Product,'id'|'name'|'sourceUrl'|'category'|'specs'>,specs:Specs):boolean{
 const match=metadataRole(product);if(!match)return false;
 const keys=match.role.offer.packQuantity===undefined?['batteryKind','accessoryType','kitType']:Object.keys(match.role.destination.specs);
 return keys.some(key=>Object.hasOwn(specs,key));
}

/** Undefined means hold: changed identity, selection, raw anchors or prior evidence. */
export function applyReviewedStorageRole(product:Product):Product|undefined{
 const match=metadataRole(product);if(!match)return;
 // An old-category specification needs explicit provenance-aware migration first.
 if(product.specification)return;
 const {role,applied}=match;
 if(product.offers.length!==1)return;
 const offer=product.offers[0];
 if(offer.id!==role.offer.id||offer.retailerId!==role.offer.retailerId||offer.url!==role.offer.url||offer.sku!==role.offer.sku)return;
 if(role.offer.packQuantity!==undefined&&offer.packQuantity!==role.offer.packQuantity)return;
 return applied?product:{...product,category:role.destination.category,specs:{...product.specs,...role.destination.specs}};
}
