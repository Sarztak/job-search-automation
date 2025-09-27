// Clear old data
localStorage.removeItem('linkedinPeople');
console.log('Cleared old LinkedIn people data');

// Verify it's cleared
console.log('Current data:', localStorage.getItem('linkedinPeople'));