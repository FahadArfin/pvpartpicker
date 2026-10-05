"""Build original, reproducible textbook diagrams. No external artwork is copied."""
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parents[1] / 'public' / 'guide' / 'diagrams'
OUT.mkdir(parents=True, exist_ok=True)
def text(x,y,value,size=18,color='#213e3d',anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(value)}</text>'
def box(x,y,w,h,title,subtitle='',fill='#eaf2ee'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="#789b94"/>'+text(x+w/2,y+32,title,18,anchor='middle')+(text(x+w/2,y+58,subtitle,14,anchor='middle') if subtitle else '')
def line(x,y,a,b,color='#376f66',arrow=True,dash=False):
    return f'<path d="M{x},{y} L{a},{b}" fill="none" stroke="{color}" stroke-width="3"'+(' marker-end="url(#arrow)"' if arrow else '')+(' stroke-dasharray="7 6"' if dash else '')+'/>'
def panel(x,y,w=100,h=65):
    result=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="#183e56" stroke="#7095a7"/>'
    for i in range(1,4): result+=line(x+w*i/4,y,x+w*i/4,y+h,'#83adbb',False)
    for i in range(1,3): result+=line(x,y+h*i/3,x+w,y+h*i/3,'#83adbb',False)
    return result
def save(name,title,desc,body):
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#376f66"/></marker></defs><rect width="960" height="540" rx="12" fill="#f5f8f5"/><g font-family="Arial, sans-serif">{text(32,42,title,24)}{body}{text(32,514,'PVPartPicker · original teaching diagram · conceptual, not an installation drawing',13,'#5a706b')}</g></svg>'''
    (OUT / f'{name}.svg').write_text(svg,encoding='utf-8')

save('energy-flow','Follow the energy — watts now, watt-hours over time',
 'Sunlight reaches a PV array. DC power passes through charge control to a battery, then through an inverter to AC loads. Each conversion has losses.',
 text(40,112,'SUNLIGHT',16)+line(106,128,106,182)+panel(55,193)+text(40,288,'PV array: DC source')+
 line(160,228,249,228)+box(260,189,190,82,'MPPT / controller','Tracks PV; regulates charging')+
 line(450,228,534,228)+box(545,189,170,82,'Battery + BMS','Stores chemical energy')+
 line(630,271,630,330)+box(545,341,170,82,'Inverter','DC → AC')+
 line(715,382,778,382)+box(790,341,135,82,'AC loads','Power used now')+
 text(260,340,'Power (W) = instantaneous flow',19)+text(260,373,'Energy (Wh) = accumulated power × time',19)+
 text(260,439,'Transfer equipment and protection omitted for clarity.',15)+box(790,442,135,50,'Grid (optional)')+line(858,423,858,440))

save('module-anatomy','Module anatomy — cell structure and panel face are different',
 'An exploded conceptual module has front glass, encapsulant, solar cells, rear encapsulant, rear glass or backsheet, frame, and rear junction box with bypass diodes.',
 ''.join(f'<path d="M85,{y} L440,{y-35} L515,{y+10} L160,{y+45}z" fill="{color}" stroke="#557e88"/>'+text(565,y+15,label,18) for y,color,label in [(130,'#cbe5ee','Front glass: admits light'),(190,'#d9ece7','Encapsulant: protects and bonds'),(250,'#174c67','Cells: generate electrical current'),(310,'#d9ece7','Rear encapsulant'),(370,'#b6cfcd','Rear glass OR polymer backsheet')])+
 text(60,457,'Frame and clamp zones are model-specific.',16)+text(565,428,'Rear junction box / bypass diodes',16)+text(565,457,'Bifacial requires a light-admitting rear.',16))

save('series-parallel','Series changes voltage; parallel changes current',
 'Three identical hypothetical 40 volt, 10 amp modules in series produce 120 volts at 10 amps. Three such modules in parallel produce 40 volts at 30 amps at the same operating condition.',
 text(38,97,'SERIES — same current through each module',18)+''.join(panel(x,120) for x in [48,225,402])+
 line(148,151,214,151)+line(325,151,391,151)+line(502,151,604,151)+box(618,113,300,88,'3 × 40 V = 120 V','10 A through the string')+
 text(38,252,'PARALLEL — branch currents combine',18)+''.join(panel(75,y) for y in [280,355,430])+
 ''.join(line(175,y+32,375,y+32,arrow=False) for y in [280,355,430])+
 line(375,312,375,462,arrow=False)+line(375,387,604,387)+box(618,345,300,88,'40 V at the shared output','3 × 10 A = 30 A')+
 text(618,469,'Hypothetical Vmp / Imp, not Voc / Isc.',14))

save('iv-curve','Read the I–V curve: current, voltage and the knee',
 'A conceptual IV curve begins at short-circuit current with zero voltage, stays relatively flat, then drops to zero at open-circuit voltage. Maximum power lies near the knee, not at either axis intercept.',
 line(95,435,95,111,arrow=False)+line(95,435,800,435,arrow=False)+
 '<path d="M95 175 C250 178 435 175 590 208 C660 228 707 323 743 435" fill="none" stroke="#28766a" stroke-width="5"/>'+
 line(595,211,595,435,'#bd8030',False,True)+line(95,211,595,211,'#bd8030',False,True)+
 '<circle cx="595" cy="211" r="7" fill="#bd8030"/>'+
 text(28,104,'I (A)',18)+text(790,472,'V (V)',18)+text(110,160,'Isc: V = 0',16)+text(739,459,'Voc: I = 0',16)+text(603,201,'MPP: Vmp × Imp',18)+
 text(105,277,'At the two intercepts, power = 0.',18)+text(105,311,'More irradiance mainly raises current.',17)+text(105,342,'Higher cell temperature usually lowers voltage.',17)+text(95,486,'Illustrative curve only — no numerical equipment ratings implied.',14))

save('battery-bank','Battery bank — energy and discharge power are separate limits',
 'Two hypothetical 51.2 volt, 100 amp-hour batteries in parallel retain 51.2 volt nominal voltage and provide 200 amp-hours. Protected branches feed shared DC distribution and an inverter.',
 box(40,125,220,95,'Battery A + BMS','51.2 V nominal · 100 Ah')+box(40,325,220,95,'Battery B + BMS','51.2 V nominal · 100 Ah')+
 line(260,173,344,173)+box(355,142,130,65,'Protection')+line(485,173,555,173,arrow=False)+
 line(260,373,344,373)+box(355,342,130,65,'Protection')+line(485,373,555,373,arrow=False)+line(555,173,555,373,arrow=False)+line(555,273,628,273)+
 box(640,230,260,85,'DC distribution → inverter','Cable / fuse / BMS limits apply')+
 text(650,370,'Nominal energy:',18)+text(650,403,'51.2 × 200 = 10,240 Wh',20)+text(650,442,'Usable AC energy will be lower.',16)+
 text(40,473,'Simplified functional path; polarity, disconnects and sensing are not shown.',14))

save('inverter-topology','AC coupling and DC coupling — where PV enters the system',
 'DC-coupled PV reaches charge control and a DC battery bus before the inverter. AC-coupled PV reaches a PV inverter and AC bus, with a separate bidirectional battery inverter. Outage operation needs compatible control and isolation.',
 text(38,100,'DC COUPLED',18)+panel(45,128)+line(145,162,220,162)+box(230,123,195,80,'MPPT / DC bus','PV and battery DC')+line(425,162,495,162)+box(505,123,200,80,'Battery inverter','DC ↔ AC')+line(705,162,783,162)+box(793,123,125,80,'AC loads')+
 line(328,203,328,232)+box(230,243,195,70,'Battery + BMS')+
 text(38,355,'AC COUPLED',18)+panel(45,378)+line(145,410,220,410)+box(230,372,195,80,'PV inverter','DC → AC')+line(425,410,495,410)+box(505,372,200,80,'AC bus / loads','Controlled energy balance')+line(705,410,766,410)+box(778,372,155,80,'Battery system','AC ↔ DC')+
 text(38,480,'Backup requires an approved grid-forming / isolation arrangement; AC bus ≠ grid by default.',14))

save('roof-load-path','Roof mounting — follow loads into the structure',
 'Conceptual cross-section shows a module clamped to a rail, rail attached through a weatherproof roof attachment to a rafter. Wind uplift and gravity travel through every connection. Roof covering alone is not the structural path.',
 '<path d="M100 300 L805 300 L805 350 L100 350z" fill="#e5d5b8" stroke="#947d59"/>'+text(565,336,'Roof deck / covering',18)+
 '<rect x="355" y="350" width="115" height="115" fill="#cdb58d" stroke="#947d59"/>'+text(485,425,'Rafter / structural member',18)+
 '<rect x="160" y="159" width="560" height="24" fill="#183e56"/><rect x="330" y="198" width="240" height="28" fill="#a4b7b5"/>'+text(615,177,'Module',18)+text(590,219,'Rail',18)+
 '<path d="M390 180 L390 225 M440 225 L440 379" stroke="#596d6d" stroke-width="12"/>'+text(105,216,'Clamp',18)+line(190,216,374,194,arrow=False)+
 '<path d="M350 301 L470 301 L470 282 L410 282" fill="none" stroke="#bf863c" stroke-width="6"/>'+text(70,275,'Flashing / seal detail',18)+line(260,273,365,293,arrow=False)+
 line(440,80,440,137)+text(470,98,'Gravity',17)+line(290,144,290,84)+text(145,103,'Wind uplift',17)+
 text(70,480,'Conceptual cross-section. Attachment spacing and seal method require the specific engineered system.',14))

save('ground-spacing','Ground rows — a geometry check, not a yearly shade model',
 'A raised row casts a longer shadow at lower solar elevation. Horizontal shadow reach is height divided by tangent of solar elevation. Terrain, azimuth and sloping ground complicate the geometry.',
 line(70,435,900,435,arrow=False)+
 '<path d="M185 435 L350 242" stroke="#214c62" stroke-width="14"/><path d="M610 435 L775 242" stroke="#214c62" stroke-width="14"/>'+
 line(350,242,690,435,'#bd8030',False,True)+line(350,242,350,435,'#809691',False,True)+line(350,458,690,458,arrow=False)+
 text(365,335,'H',22)+text(435,487,'L = H ÷ tan(α)',20)+text(559,417,'α',23)+
 text(95,118,'Lower winter sun → longer shadow',22)+text(95,160,'Example: H = 2 m, α = 20°',18)+text(95,190,'L ≈ 5.49 m from the vertical projection of the upper edge',16)+
 text(710,310,'Next row',18)+text(710,350,'Row pitch also includes',15)+text(710,375,'the module footprint.',15)+text(710,403,'Not to scale.',14))

save('dc-protection','Protection functions — do not confuse the ratings',
 'A DC source feeds fault-rated protection, a suitable disconnect, conductor and load. A battery fault can supply high current. Fuse current, voltage and interrupt ratings answer different questions.',
 box(40,190,150,90,'DC source','PV or battery')+line(190,235,253,235)+box(265,190,170,90,'Fuse / breaker','Fault interruption')+line(435,235,498,235)+box(510,190,170,90,'Disconnect','Safe isolation')+line(680,235,743,235)+box(755,190,150,90,'DC load','Controller / inverter')+
 text(45,335,'Current rating (A): protects the selected circuit under defined conditions.',18)+
 text(45,372,'Voltage rating (V DC): can interrupt at the circuit’s maximum voltage.',18)+
 text(45,409,'Interrupt rating: can clear the available fault current.',18)+
 text(45,446,'Cable ampacity and routing conditions remain separate checks.',18)+
 text(45,112,'Functional illustration only — grounding, polarity and complete protection omitted.',15))

save('meter-boundaries','Monitoring — define the measurement boundary',
 'A site has PV production, home consumption, battery charge/discharge and grid import/export. Different meters measure different boundaries. Signs, timestamps and AC/DC boundaries must agree to reconcile energy.',
 box(65,110,220,85,'PV production','Measure generated energy')+line(285,152,420,152)+box(432,110,220,85,'AC site bus','Balance all simultaneous flows')+
 line(542,195,542,286)+box(432,299,220,85,'House loads','Consumption, not PV yield')+
 line(652,152,730,152)+box(742,110,160,85,'Grid meter','Import ↔ export')+
 box(65,299,220,85,'Battery system','Charge ↔ discharge')+line(285,342,420,342)+
 text(65,447,'AC energy balance: PV + grid import + battery discharge',18)+
 text(65,477,'= loads + grid export + battery charge + boundary losses',18))

save('cash-flow','Separate equipment cost, delivered cost and lifetime value',
 'A purchase comparison adds equipment, freight, balance-of-system and installation costs. A lifetime analysis then considers verified incentives, energy bill savings, maintenance and replacement costs.',
 ''.join(box(x,110,180,80,t,s) for x,t,s in [(35,'Equipment','Actual package quantity'),(275,'Freight / tax','Delivered condition'),(515,'Balance of system','Protection / mounting'),(755,'Installation','Labor / approvals')])+
 ''.join(line(x,150,x+25,150) for x in [240,480,720])+
 text(50,260,'UPFRONT: complete installed cost − verified eligible benefits',20)+
 text(50,325,'ONGOING: valued self-consumption + export revenue − running costs',20)+
 text(50,390,'LIFECYCLE: include timing, degradation, financing and replacements',20)+
 text(50,455,'Hypothetical price ≠ observed offer. Simple payback ≠ investment forecast.',17))

save('commissioning','Commissioning — evidence before normal operation',
 'A conceptual sequence starts with approved documents and physical verification, then manufacturer configuration, controlled function tests, measurement baseline and owner handover. Failed checks return to diagnosis rather than progress.',
 ''.join(box(x,y,260,80,t,s) for x,y,t,s in [(40,110,'1 · Documents','Exact models / approved drawings'),(350,110,'2 · Verification','Qualified inspection / safe tests'),(660,110,'3 · Configuration','Manufacturer sequence / settings'),(660,315,'4 · Function tests','Modes / alarms / backup behavior'),(350,315,'5 · Baseline','Record measurements and firmware'),(40,315,'6 · Handover','Limits / shutdown / service plan')])+
 line(300,150,338,150)+line(610,150,648,150)+line(790,190,790,303)+line(660,355,622,355)+line(350,355,312,355)+
 text(45,455,'If a test fails: stop, record, diagnose and repeat the affected acceptance checks.',17))
save('power-and-energy','Power is height; energy is the area under the curve',
 'A constant 2 kilowatt load from hour zero to hour three forms a rectangle of area 6 kilowatt-hours. A separate 6 kilowatt one-hour peak also uses 6 kilowatt-hours but needs more instantaneous power.',
 line(95,420,95,100,arrow=False)+line(95,420,865,420,arrow=False)+
 '<path d="M95 420 L95 330 L605 330 L605 420z" fill="#bcded1" stroke="#28766a" stroke-width="3"/>'+
 '<path d="M690 420 L690 150 L860 150 L860 420z" fill="#f0dcb8" stroke="#ac803d" stroke-width="3"/>'+
 text(35,95,'kW',18)+text(110,310,'2 kW × 3 h = 6 kWh',21)+text(641,115,'6 kW × 1 h = 6 kWh',18)+
 ''.join(text(x,447,label,15,anchor='middle') for x,label in [(95,'0'),(265,'1'),(435,'2'),(605,'3'),(690,'3.5'),(860,'4.5')])+
 text(778,481,'Time (hours)',18)+text(115,216,'Same energy; different power requirement.',20)+
 text(100,480,'Hypothetical rectangular loads; not a solar production forecast.',14))

save('temperature-voltage','Cold modules raise voltage — check the equipment ceiling',
 'A hypothetical module has 50 volt Voc at 25 degrees Celsius and a minus 0.25 percent per degree Voc coefficient. At minus 10 degrees its approximate Voc is 54.375 volts; at 65 degrees it is 45 volts. The chart is a linear teaching approximation.',
 line(105,425,105,105,arrow=False)+line(105,425,825,425,arrow=False)+
 '<path d="M180 145 L460 245 L780 359" fill="none" stroke="#28766a" stroke-width="4"/>'+
 ''.join(f'<circle cx="{x}" cy="{y}" r="6" fill="#28766a"/>'+text(x,y-19,label,16,anchor='middle') for x,y,label in [(180,145,'54.375 V'),(460,245,'50 V'),(780,359,'45 V')])+
 ''.join(text(x,456,label,16,anchor='middle') for x,label in [(180,'−10°C'),(460,'25°C'),(780,'65°C')])+
 text(34,90,'Voc (V)',18)+text(665,486,'Cell temperature',17)+
 text(265,125,'Approximate Voc(T) = Voc(25) × [1 + β × (T − 25)]',17)+
 text(145,350,'β = −0.0025 / °C for this hypothetical module',17)+
 text(145,387,'Actual coefficients and design temperatures come from documented inputs.',14))
save('module-level-conversion','Central and module-level conversion — place the DC/AC boundary',
 'In a central conversion example, multiple PV modules feed one inverter through a DC path. In a module-level example, each module feeds a microinverter before their outputs join an AC branch. Module-level optimizers are different devices and are not pictured.',
 text(38,100,'CENTRAL CONVERSION',18)+panel(45,130)+panel(210,130)+line(145,162,200,162)+line(310,162,490,162)+box(505,123,220,80,'String inverter','DC → AC')+line(725,162,782,162)+box(795,123,130,80,'AC network')+
 text(344,148,'DC path',17)+text(38,300,'MODULE-LEVEL CONVERSION',18)+panel(45,340)+panel(350,340)+line(145,372,173,372)+line(450,372,478,372)+box(185,332,145,82,'Microinverter','DC → AC')+box(490,332,145,82,'Microinverter','DC → AC')+
 line(258,414,258,454,arrow=False)+line(563,414,563,454,arrow=False)+line(258,454,740,454,arrow=False)+line(740,454,740,373,arrow=False)+line(740,373,782,373)+box(795,332,130,82,'AC network')+
 text(645,440,'AC branch',16)+text(38,482,'Functional examples; approved topology, protection and grid response are separate checks.',14))
print(f'Created {len(list(OUT.glob("*.svg")))} original diagrams')
