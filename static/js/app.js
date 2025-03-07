// from data.js
const tableData = data;

// get table references
var tbody = d3.select("tbody");

function buildTable(data) {
  // First, clear out any existing data
  tbody.html("");

  // Next, loop through each object in the data
  // and append a row and cells for each value in the row
  data.forEach((dataRow) => {
    // Append a row to the table body
    let row = tbody.append("tr");

    // Loop through each field in the dataRow and add
    // each value as a table cell (td)
    Object.values(dataRow).forEach((val) => {
      let cell = row.append("td");
      cell.text(val);
    });
  });
}

// Create a function to handle all filters
function filterData() {
  // Grab all the input values
  let date = d3.select("#datetime").property("value");
  let city = d3.select("#city").property("value").toLowerCase();
  let state = d3.select("#state").property("value").toLowerCase();
  let country = d3.select("#country").property("value").toLowerCase();
  let shape = d3.select("#shape").property("value").toLowerCase();
  
  // Apply filters
  let filteredData = tableData;
  
  // Apply each filter with a check
  if (date) {
    filteredData = filteredData.filter(row => row.datetime === date);
  }
  
  if (city) {
    filteredData = filteredData.filter(row => row.city === city);
  }
  
  if (state) {
    filteredData = filteredData.filter(row => row.state === state);
  }
  
  if (country) {
    filteredData = filteredData.filter(row => row.country === country);
  }
  
  if (shape) {
    filteredData = filteredData.filter(row => row.shape === shape);
  }
  
  // Rebuild the table using the filtered data
  buildTable(filteredData);
  
  // Display the count of filtered results
  let results = document.querySelector("#filter-form");
  let count = document.createElement("p");
  count.textContent = `Showing ${filteredData.length} results`;
  count.className = "mt-3 text-white";
  
  // Remove previous count if exists
  let oldCount = results.querySelector("p");
  if (oldCount) {
    results.removeChild(oldCount);
  }
  
  results.appendChild(count);
}

// Attach an event to listen for the filter button
d3.select("#filter-btn").on("click", filterData);

// Add handler for reset button
d3.select("#reset-btn").on("click", function() {
  // Clear all input fields
  document.getElementById("datetime").value = "";
  document.getElementById("city").value = "";
  document.getElementById("state").value = "";
  document.getElementById("country").value = "";
  document.getElementById("shape").value = "";
  
  // Rebuild the table with all data
  buildTable(tableData);
  
  // Remove results count
  let results = document.querySelector("#filter-form");
  let oldCount = results.querySelector("p");
  if (oldCount) {
    results.removeChild(oldCount);
  }
});

// Build the table when the page loads
buildTable(tableData);
