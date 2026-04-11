const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Hazard data by location (mock database) 
const hazardData = {
  'patna': {
    city: 'Patna, Bihar',
    country: 'India',
    lat: 25.5941, lng: 85.1376,
    hazards: {
      flood:   { level: 'CRITICAL', score: 92, trend: 'Worsening by 2030', trend2050: 'Extreme by 2050' },
      heat:    { level: 'HIGH',     score: 80, trend: 'Severe by 2030',    trend2050: 'Critical by 2050' },
      drought: { level: 'MEDIUM',   score: 55, trend: 'Stable near-term',  trend2050: 'Worsening by 2050' },
      storm:   { level: 'MEDIUM',   score: 60, trend: 'Intensifying 2030', trend2050: 'High by 2050' },
      air:     { level: 'MODERATE', score: 45, trend: 'Seasonal concern',  trend2050: 'Medium by 2050' }
    },
    plans: [
      { id:1, title:'Early warning SMS flood alert network', desc:'Deploy river-level sensors + automated SMS broadcast to alert 200,000 households 6+ hours before floods.', cost:'$18,000', time:'3 months', impact:'Saves 340+ lives/yr', minBudget:10 },
      { id:2, title:'Urban green corridors + tree canopy expansion', desc:'Plant 50,000 trees along key arterials to reduce urban heat island by 2–4°C and absorb 15% more stormwater.', cost:'$65,000', time:'6 months', impact:'−3°C heat island', minBudget:50 },
      { id:3, title:'Rooftop rainwater harvesting (500 households)', desc:'Low-cost catchment systems in drought-vulnerable wards, reducing water insecurity for 2,500+ residents.', cost:'$90,000', time:'4 months', impact:'2,500 people protected', minBudget:80 },
      { id:4, title:'Flood-resilient drainage infrastructure upgrade', desc:'Widen and elevate 12km of drainage channels in flood-prone wards, diverting peak flows away from settlements.', cost:'$340,000', time:'12 months', impact:'Protects 80,000 homes', minBudget:300 },
      { id:5, title:'Community climate resilience training hubs', desc:'Train 500 community volunteers as local climate officers with early-response protocols and relief coordination.', cost:'$25,000', time:'2 months', impact:'Builds local capacity', minBudget:20 }
    ],
    stats: { population:'2.3M', riskIndex:78, avoidedDamage:'$3.2M', roi:16 }
  },
  'dhaka': {
    city: 'Dhaka', country: 'Bangladesh',
    lat: 23.8103, lng: 90.4125,
    hazards: {
      flood:   { level: 'CRITICAL', score: 95, trend: 'Already critical', trend2050: 'Extreme by 2050' },
      heat:    { level: 'HIGH',     score: 85, trend: 'Accelerating', trend2050: 'Severe by 2050' },
      drought: { level: 'LOW',      score: 30, trend: 'Low concern', trend2050: 'Moderate 2050' },
      storm:   { level: 'HIGH',     score: 78, trend: 'Cyclone season risk', trend2050: 'Critical by 2050' },
      air:     { level: 'HIGH',     score: 82, trend: 'Urban air crisis', trend2050: 'Worsening' }
    },
    plans: [
      { id:1, title:'Cyclone-resistant community shelters', desc:'Build 20 multi-purpose shelters with elevated floors and storm-rated construction across low-lying wards.', cost:'$200,000', time:'8 months', impact:'Protects 40,000 people', minBudget:150 },
      { id:2, title:'Urban drainage overhaul — Zone 4', desc:'Replace colonial-era drains with capacity-scaled channels able to handle 100yr flood events.', cost:'$450,000', time:'18 months', impact:'Prevents $12M damage/yr', minBudget:400 },
      { id:3, title:'Air quality monitoring + school alert system', desc:'Deploy 50 IoT sensors citywide; trigger school closures and health alerts on high-pollution days.', cost:'$35,000', time:'2 months', impact:'Protects 200K children', minBudget:30 }
    ],
    stats: { population:'21M', riskIndex:88, avoidedDamage:'$8.5M', roi:19 }
  },
  'jakarta': {
    city: 'Jakarta', country: 'Indonesia',
    lat: -6.2088, lng: 106.8456,
    hazards: {
      flood:   { level: 'CRITICAL', score: 97, trend: 'Sinking city', trend2050: 'Submerged risk' },
      heat:    { level: 'HIGH',     score: 75, trend: 'UHI intensifying', trend2050: 'High by 2050' },
      drought: { level: 'LOW',      score: 25, trend: 'Low risk', trend2050: 'Low' },
      storm:   { level: 'MEDIUM',   score: 55, trend: 'Moderate cyclone risk', trend2050: 'Higher' },
      air:     { level: 'HIGH',     score: 80, trend: 'Traffic pollution', trend2050: 'Critical' }
    },
    plans: [
      { id:1, title:'Mangrove coastal buffer restoration', desc:'Restore 500 hectares of mangrove forest to absorb storm surge and reduce coastal flooding by 40%.', cost:'$120,000', time:'6 months', impact:'40% surge reduction', minBudget:100 },
      { id:2, title:'Groundwater recharge ponds network', desc:'Construct 80 recharge ponds across residential areas to counter land subsidence and replenish aquifer.', cost:'$280,000', time:'10 months', impact:'Slows sinking by 30%', minBudget:250 },
      { id:3, title:'Elevated pedestrian emergency evacuation routes', desc:'Build 15km of elevated walkways for rapid evacuation during sudden flood events.', cost:'$600,000', time:'24 months', impact:'Saves 500K people access', minBudget:550 }
    ],
    stats: { population:'34M', riskIndex:91, avoidedDamage:'$15M', roi:21 }
  }
};

// Helper: normalize location input
function normalizeLocation(input) {
  const s = input.toLowerCase().trim();
  if (s.includes('patna') || s.includes('bihar')) return 'patna';
  if (s.includes('dhaka') || s.includes('bangladesh')) return 'dhaka';
  if (s.includes('jakarta') || s.includes('indonesia')) return 'jakarta';
  return 'patna'; // default
}

// Routes
app.get('/', (req, res) => {
  res.render('home', { title: 'ClimateResilience Copilot', location: null, data: null });
});

app.post('/analyse', (req, res) => {
  const { location, budget } = req.body;
  const key = normalizeLocation(location || 'patna');
  const data = hazardData[key];
  const budgetVal = parseInt(budget) || 200;
  const activePlans = data.plans.filter(p => p.minBudget <= budgetVal);
  const avoidedDmg = (budgetVal * 16000).toLocaleString();
  const roi = 16;

  res.json({
    city: data.city,
    country: data.country,
    hazards: data.hazards,
    plans: activePlans,
    stats: data.stats,
    budget: budgetVal,
    avoidedDamage: `$${avoidedDmg}`,
    roi,
    actionsCount: activePlans.length
  });
});

app.get('/api/locations', (req, res) => {
  const locations = Object.values(hazardData).map(d => ({ city: d.city, country: d.country }));
  res.json(locations);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌍 ClimateResilience Copilot running at http://localhost:${PORT}\n`);
});