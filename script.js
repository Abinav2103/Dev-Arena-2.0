// --- Global State and Data (UPDATED STRUCTURE) ---
let machines = [
  { id: "M1", name: "Machine 1", ideal_machine_time: 8, manual_load_time: 4, run_time: 8, power: 2.5, output: 0, energy: 0, cost: 0, actual_cycle_time: 0 },
  { id: "M2", name: "Machine 2", ideal_machine_time: 10, manual_load_time: 12, run_time: 8, power: 3.0, output: 0, energy: 0, cost: 0, actual_cycle_time: 0 },
  { id: "M3", name: "Machine 3", ideal_machine_time: 20, manual_load_time: 6, run_time: 8, power: 4.0, output: 0, energy: 0, cost: 0, actual_cycle_time: 0 },
  { id: "M4", name: "Machine 4", ideal_machine_time: 7, manual_load_time: 3, run_time: 8, power: 2.0, output: 0, energy: 0, cost: 0, actual_cycle_time: 0 },
  { id: "M5", name: "Machine 5", ideal_machine_time: 9, manual_load_time: 5, run_time: 8, power: 3.5, output: 0, energy: 0, cost: 0, actual_cycle_time: 0 },
];

const electricityRate = 8; // ₹ per kWh
const processTimeThreshold = 1.2;
const manualTimeThreshold = 1.3;
const costAlertThreshold = 200;

let myChart;

// --- Production Report Data ---
const machineData = [
  { day: "Day 1", machines: ["normal", "normal", "bottleneck", "normal", "normal"] },
  { day: "Day 2", machines: ["normal", "bottleneck", "normal", "normal", "bottleneck"] },
  { day: "Day 3", machines: ["normal", "normal", "normal", "bottleneck", "normal"] },
  { day: "Day 4", machines: ["bottleneck", "normal", "normal", "normal", "normal"] },
  { day: "Day 5", machines: ["normal", "normal", "bottleneck", "bottleneck", "normal"] },
  { day: "Day 6", machines: ["normal", "normal", "normal", "normal", "bottleneck"] },
  { day: "Day 7", machines: ["bottleneck", "bottleneck", "normal", "normal", "normal"] }
];

// --- Core Calculation Functions ---
function calculateOutput(cycleTime, runTimeHours) {
  const totalSeconds = runTimeHours * 3600;
  return Math.floor(totalSeconds / cycleTime);
}

function calculateEnergy(power, runTimeHours) {
  return power * runTimeHours;
}

function detectBottlenecks(data) {
  const totalManualTime = data.reduce((sum, m) => sum + m.manual_load_time, 0);
  const avgManualTime = totalManualTime / data.length;
  const totalIdealTime = data.reduce((sum, m) => sum + m.ideal_machine_time, 0);
  const avgIdealTime = totalIdealTime / data.length;

  return data.map(m => ({
    ...m,
    isProcessBottleneck: m.ideal_machine_time > avgIdealTime * processTimeThreshold,
    isOperatorBottleneck: m.manual_load_time > avgManualTime * manualTimeThreshold,
    isHighCost: m.cost > costAlertThreshold
  }));
}

// --- Dynamic Rendering ---
function renderInputs(containerId, inputType) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  machines.forEach((m, index) => {
    const div = document.createElement("div");
    div.className = "input-group";
    let inputHTML = `<h4>${m.name}</h4>`;

    if (inputType === 'bottleneck') {
      inputHTML += `
        <label>Ideal Machine Time (sec):</label>
        <input type="number" id="b_ideal_time_${index}" value="${m.ideal_machine_time}">
        <label>Observed Manual Load Time (sec):</label>
        <input type="number" id="b_manual_load_${index}" value="${m.manual_load_time}">
        <label>Total Run Time (hours):</label>
        <input type="number" id="b_run_${index}" value="${m.run_time}">
      `;
    } else if (inputType === 'energy') {
      inputHTML += `
        <label>Power (kW):</label>
        <input type="number" id="e_power_${index}" value="${m.power}">
        <label>Run Time (hours):</label>
        <input type="number" id="e_run_${index}" value="${m.run_time}">
      `;
    }
    div.innerHTML = inputHTML;
    container.appendChild(div);
  });
}

function callAlert(problem, machineName, contact) {
  const action = confirm(`ATTENTION: ${problem} on ${machineName}! Send work order to ${contact}?`);
  if (action) alert(`✅ Work Order Sent to ${contact} for ${machineName}.`);
  else alert('Action cancelled.');
}

function renderResults(containerId, data, resultType) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  data.forEach(m => {
    const card = document.createElement("div");
    let alertMessage = "✅ Running Normally";
    let statusClass = "";
    let buttonHTML = "";

    if (resultType === 'bottleneck') {
      if (m.isProcessBottleneck && m.isOperatorBottleneck) {
        alertMessage = "🚨 Dual Bottleneck: Machine + Operator!";
        statusClass = "bottleneck";
        buttonHTML = `<button class="alert-btn" onclick="callAlert('Dual Bottleneck', '${m.name}', 'Maintenance & Supervisor')">Address Both</button>`;
      } else if (m.isProcessBottleneck) {
        alertMessage = "⚙️ Process Bottleneck Detected";
        statusClass = "bottleneck";
        buttonHTML = `<button class="alert-btn" onclick="callAlert('Process Bottleneck', '${m.name}', 'Technician')">Call Technician</button>`;
      } else if (m.isOperatorBottleneck) {
        alertMessage = "👷 Operator Bottleneck Detected";
        statusClass = "bottleneck";
        buttonHTML = `<button class="alert-btn" onclick="callAlert('Operator Bottleneck', '${m.name}', 'Training Manager')">Request Training</button>`;
      }

      const breakdownHTML = `
        <div class="time-breakdown">
          <h4>Cycle Time Breakdown:</h4>
          <div style="display:flex;height:18px;border:1px solid #ccc;border-radius:4px;overflow:hidden;">
            <div style="width:${(m.manual_load_time/(m.actual_cycle_time)*100).toFixed(0)}%;background-color:orange;"></div>
            <div style="width:${(m.ideal_machine_time/(m.actual_cycle_time)*100).toFixed(0)}%;background-color:#1e40af;"></div>
          </div>
          <p style="font-size:0.8em;text-align:center;">
            <span style="color:orange;">■ Human Load</span> | <span style="color:#1e40af;">■ Machine Process</span>
          </p>
        </div>
      `;

      const detailsHTML = `
        <p>Total Cycle Time: <strong>${m.actual_cycle_time.toFixed(1)}s</strong></p>
        <p>Machine Time: ${m.ideal_machine_time.toFixed(1)}s</p>
        <p>Manual Time: ${m.manual_load_time.toFixed(1)}s</p>
        ${breakdownHTML}
        <hr>
        <p><strong>No. of Outputs Produced:</strong> ${m.output} units</p>
      `;

      card.className = `machine-card ${statusClass}`;
      card.innerHTML = `<h3>${m.name}</h3>${detailsHTML}<p class="status">${alertMessage}</p>${buttonHTML}`;

    } else if (resultType === 'energy') {
      const isAlert = m.cost > costAlertThreshold;
      statusClass = isAlert ? "high-cost" : "";
      alertMessage = isAlert ? `⚡ High Cost Alert` : "✅ Normal";
      buttonHTML = isAlert ? `<button class="alert-btn" onclick="callAlert('High Energy Cost', '${m.name}', 'Supervisor')">Notify Supervisor</button>` : "";

      const detailsHTML = `
        <p>Power: ${m.power} kW</p>
        <p>Run Time: ${m.run_time}h</p>
        <p>Energy Used: ${m.energy.toFixed(2)} kWh</p>
        <p>Cost: ₹${m.cost.toFixed(2)}</p>
      `;
      card.className = `machine-card ${statusClass}`;
      card.innerHTML = `<h3>${m.name}</h3>${detailsHTML}<hr><p class="status">${alertMessage}</p>${buttonHTML}`;
    }

    container.appendChild(card);
  });
}

// --- Production Report Functions ---
function generateReportTable() {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';
  
  machineData.forEach(dayData => {
    const row = document.createElement('tr');
    
    // Add day header cell
    const dayCell = document.createElement('td');
    dayCell.textContent = dayData.day;
    dayCell.className = 'day-header';
    row.appendChild(dayCell);
    
    // Add machine status cells
    dayData.machines.forEach(status => {
      const cell = document.createElement('td');
      const statusSpan = document.createElement('span');
      statusSpan.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      statusSpan.className = `status-cell ${status}`;
      cell.appendChild(statusSpan);
      row.appendChild(cell);
    });
    
    tableBody.appendChild(row);
  });
}

// Function to simulate week reset
function resetWeek() {
  const notification = document.getElementById('reset-notification');
  notification.textContent = "Week completed! Report has been reset to Day 1. Factory manager has been notified.";
  notification.style.display = 'block';
  
  // In a real application, you would reset the data here
  // For this demo, we'll just regenerate the same table
  setTimeout(() => {
    notification.style.display = 'none';
    generateReportTable();
  }, 5000);
}

// --- Core Logic ---
function calculateBottlenecks() {
  machines.forEach((m, i) => {
    m.ideal_machine_time = parseFloat(document.getElementById(`b_ideal_time_${i}`).value);
    m.manual_load_time = parseFloat(document.getElementById(`b_manual_load_${i}`).value);
    m.run_time = parseFloat(document.getElementById(`b_run_${i}`).value);

    m.actual_cycle_time = m.ideal_machine_time + m.manual_load_time;
    m.output = calculateOutput(m.actual_cycle_time, m.run_time);
    m.energy = calculateEnergy(m.power, m.run_time);
    m.cost = m.energy * electricityRate;
  });

  const updated = detectBottlenecks(machines);
  renderResults("bottleneckResults", updated, 'bottleneck');
  updateChart();
}

function calculateEnergyCost() {
  machines.forEach((m, i) => {
    m.power = parseFloat(document.getElementById(`e_power_${i}`).value);
    m.run_time = parseFloat(document.getElementById(`e_run_${i}`).value);
    m.energy = calculateEnergy(m.power, m.run_time);
    m.cost = m.energy * electricityRate;
  });

  const updated = detectBottlenecks(machines);
  renderResults("energyResults", updated, 'energy');
  updateChart();
}

function updateChart() {
  if (myChart) myChart.destroy();
  const ctx = document.getElementById("productionChart").getContext("2d");
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: machines.map(m => m.name),
      datasets: [
        { label: 'Outputs Produced', data: machines.map(m => m.output), backgroundColor: '#34d399' },
        { label: 'Energy Used (kWh)', data: machines.map(m => m.energy), backgroundColor: '#60a5fa' }
      ]
    },
    options: { 
      responsive: true, 
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: {
          labels: {
            color: '#333'
          }
        }
      }
    }
  });
}

// --- Page Navigation ---
function showPage(pageId) {
  document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active-sub-page'));
  document.getElementById(pageId).classList.add('active-sub-page');
  
  // Hide home page when any module is opened
  if (pageId !== 'homePage') {
    document.getElementById('homePage').style.display = 'none';
  }

  if (pageId === 'bottleneckPage') {
    renderInputs("bottleneckInputs", 'bottleneck');
    calculateBottlenecks();
  } else if (pageId === 'energyPage') {
    renderInputs("energyInputs", 'energy');
    calculateEnergyCost();
  } else if (pageId === 'graphPage') {
    updateChart();
  } else if (pageId === 'reportPage') {
    generateReportTable();
    // Simulate week reset after 10 seconds for demo purposes
    setTimeout(resetWeek, 10000);
  }
}

// --- Login & Logout ---
function login() {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  if (u === 'user' && p === 'password') {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    showPage('homePage');
  } else alert('Invalid credentials. Use "user" / "password".');
}

function logout() {
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  renderInputs("bottleneckInputs", 'bottleneck');
  renderInputs("energyInputs", 'energy');
  calculateBottlenecks();
  calculateEnergyCost();
  generateReportTable();
});