export const propertyOSRepository = 'https://github.com/RealEstateSassApplication/property-management-OS';

export const neighbourhoods = [
  { slug: 'colombo', name: 'Colombo', label: 'City living', accent: '#374d43', intro: 'Start with the places you need to reach regularly and compare properties around those routes.', checks: ['Test the commute during your actual working hours.', 'Ask about service charges, parking and backup power.', 'Check noise levels on weekdays and weekends.'] },
  { slug: 'nugegoda', name: 'Nugegoda', label: 'Everyday convenience', accent: '#806d50', intro: 'Compare individual streets and transport options rather than assuming the whole area has the same access.', checks: ['Walk from the property to your usual transport stop.', 'Check grocery, pharmacy and other everyday errands.', 'Ask the owner about water supply and parking.'] },
  { slug: 'maharagama', name: 'Maharagama', label: 'A different pace', accent: '#657557', intro: 'Consider your full weekly routine when comparing homes, including work, family visits and errands.', checks: ['Try the route to work at peak and off-peak hours.', 'Check the road access and drainage near the property.', 'Compare rent and transport together in your monthly budget.'] },
  { slug: 'rajagiriya', name: 'Rajagiriya', label: 'Connected living', accent: '#52645e', intro: 'Compare apartment and house options using the same budget, commute and space requirements.', checks: ['Ask which maintenance costs are included in rent.', 'Check lift access, parking and visitor arrangements where relevant.', 'Visit the property after rain and during a busy period.'] },
  { slug: 'dehiwala', name: 'Dehiwala', label: 'South of the city', accent: '#617880', intro: 'Look at the immediate surroundings and travel options before deciding whether a property fits your routine.', checks: ['Inspect ventilation and signs of damp inside the home.', 'Check the walking route to daily services and transport.', 'Ask about deposit terms, repairs and utility billing.'] },
] as const;

export const collections = [
  { title: 'Apartments to rent', description: 'Find a space that suits your routine.', href: '/listings?purpose=rent&type=apartment', number: '01' },
  { title: 'Houses to call home', description: 'Explore houses available for sale.', href: '/listings?purpose=sale&type=house', number: '02' },
  { title: 'Land to build on', description: 'Browse land offered for sale.', href: '/listings?purpose=sale&type=land', number: '03' },
  { title: 'Places for a getaway', description: 'Discover short-stay listings.', href: '/listings?purpose=booking', number: '04' },
] as const;
