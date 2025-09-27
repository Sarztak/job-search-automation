// Get the data from localStorage
var data = JSON.parse(localStorage.getItem('linkedinPeople') || '[]');

// Convert to JSON string with nice formatting
var jsonString = JSON.stringify(data, null, 2);

// Create a downloadable file
var blob = new Blob([jsonString], {type: 'application/json'});
var url = URL.createObjectURL(blob);

// Create download link and click it
var a = document.createElement('a');
a.href = url;
a.download = 'linkedin-people-' + new Date().toISOString().slice(0,10) + '.json';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

// Clean up
URL.revokeObjectURL(url);

console.log('Downloaded ' + data.length + ' people to JSON file');

