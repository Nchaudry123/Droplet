let waterGoal = 0;
let currentIntake = 0;
let intakeLog = [];

// DOM elements
const waterLevel = document.querySelector('.water-level');
const waterInfo = document.querySelector('.water-info');
const totalIntakeEl = document.getElementById('totalIntake');
const progressPercentEl = document.getElementById('progressPercent');
const remainingAmountEl = document.getElementById('remainingAmount');
const intakeLogEl = document.getElementById('intakeLog');
const modalOverlay = document.getElementById('modalOverlay');
const customModal = document.getElementById('customModal');
const emailModal = document.getElementById('emailModal');
const emailSuccess = document.getElementById('emailSuccess');
const reportWrapper = document.getElementById('reportWrapper');
const reportContent = document.getElementById('reportContent');

// Weight and height unit conversion
let currentWeightUnit = 'kg';
let currentHeightUnit = 'cm';

function convertWeight(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'kg' && toUnit === 'lb') return value * 2.20462;
    if (fromUnit === 'lb' && toUnit === 'kg') return value / 2.20462;
    return value;
}

function convertHeight(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'cm' && toUnit === 'ft') return value / 30.48;
    if (fromUnit === 'ft' && toUnit === 'cm') return value * 30.48;
    return value;
}

// Add event listeners for unit toggles
document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.closest('.weight-input-group, .height-input-group').querySelector('input');
        const currentValue = parseFloat(input.value);
        const newUnit = btn.dataset.unit;
        const isWeight = btn.closest('.weight-input-group') !== null;
        const currentUnit = isWeight ? currentWeightUnit : currentHeightUnit;
        
        if (newUnit !== currentUnit) {
            // Convert the value
            const convertedValue = isWeight 
                ? convertWeight(currentValue, currentUnit, newUnit)
                : convertHeight(currentValue, currentUnit, newUnit);
            
            input.value = Math.round(convertedValue * 10) / 10;
            
            // Update active state
            btn.closest('.unit-toggle').querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update current unit
            if (isWeight) {
                currentWeightUnit = newUnit;
            } else {
                currentHeightUnit = newUnit;
            }
        }
    });
});

// Format volume to display as liters if >= 1000ml
function formatVolume(amount) {
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}L`;
    }
    return `${amount} ml`;
}

// Calculate water needs
function calculateWaterNeeds() {
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const weightInKg = currentWeightUnit === 'lb' ? convertWeight(weight, 'lb', 'kg') : weight;
    const age = parseInt(document.getElementById('age').value);
    const height = parseFloat(document.getElementById('height').value);
    const heightInCm = currentHeightUnit === 'ft' ? convertHeight(height, 'ft', 'cm') : height;
    const activity = document.getElementById('activity').value;
    
    // Base calculation by weight (using kg)
    let waterAmount = weightInKg * 30; // 30ml per kg of body weight
    
    // Adjustments based on factors
    
    // Gender adjustment
    if (gender === 'male') {
        waterAmount *= 1.1; // Males typically need about 10% more
    }
    
    // Age adjustment - older adults may need less
    if (age > 65) {
        waterAmount *= 0.9;
    }
    
    // Activity level adjustment
    const activityFactors = {
        sedentary: 1.0,
        light: 1.1,
        moderate: 1.2,
        active: 1.3,
        very: 1.4
    };
    waterAmount *= activityFactors[activity] || 1.0;
    
    // Round to nearest 100ml
    waterAmount = Math.round(waterAmount / 100) * 100;
    
    // Update water goal
    waterGoal = waterAmount;
    updateWaterDisplay();
    
    // Add ripple effect to water container
    addRippleEffect(document.querySelector('.water-container'));
}

// Update water display
function updateWaterDisplay() {
    const percentage = waterGoal > 0 ? (currentIntake / waterGoal) * 100 : 0;
    const clampedPercentage = Math.min(percentage, 100); // Cap at 100%
    
    // Update water level
    waterLevel.style.height = `${clampedPercentage}%`;
    
    // Update water info using formatted volume
    waterInfo.textContent = `${formatVolume(currentIntake)} / ${formatVolume(waterGoal)}`;
    
    // Update stats
    totalIntakeEl.textContent = formatVolume(currentIntake);
    progressPercentEl.textContent = `${Math.round(percentage)}%`;
    remainingAmountEl.textContent = formatVolume(Math.max(0, waterGoal - currentIntake));
    
    // Change water color based on progress
    if (percentage < 25) {
        waterLevel.style.background = 'linear-gradient(to bottom, #ff9999 0%, #ff5555 100%)';
    } else if (percentage < 75) {
        waterLevel.style.background = 'linear-gradient(to bottom, #ffcc66 0%, #ffaa00 100%)';
    } else {
        waterLevel.style.background = 'linear-gradient(to bottom, var(--secondary) 0%, var(--primary) 100%)';
    }
}

// Add water intake
function addWaterIntake(amount) {
    if (waterGoal === 0) {
        alert('Please calculate your water needs first!');
        return;
    }
    
    currentIntake += amount;
    
    // Log this intake
    intakeLog.push({
        amount,
        time: new Date().toISOString()
    });
    
    updateWaterDisplay();
    renderIntakeLog();
    
    // Add ripple effect
    addRippleEffect(document.querySelector('.water-container'));
}

// Reset intake for the day
function resetIntake() {
    if (confirm('Are you sure you want to reset today\'s water intake?')) {
        currentIntake = 0;
        intakeLog = [];
        updateWaterDisplay();
        renderIntakeLog();
        reportWrapper.style.display = 'none';
    }
}

// Render intake log
function renderIntakeLog() {
    intakeLogEl.innerHTML = '';
    
    if (intakeLog.length === 0) {
        intakeLogEl.innerHTML = '<p>No intake recorded today</p>';
        return;
    }
    
    // Sort by time (newest first)
    const sortedLog = [...intakeLog].sort((a, b) => 
        new Date(b.time) - new Date(a.time)
    );
    
    sortedLog.forEach(entry => {
        const time = new Date(entry.time);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.innerHTML = `
            <span>${timeStr}</span>
            <span>+${formatVolume(entry.amount)}</span>
        `;
        
        intakeLogEl.appendChild(logItem);
    });
}

// Add ripple effect
function addRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${rect.width / 2 - size / 2}px`;
    ripple.style.top = `${rect.height / 2 - size / 2}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 1000);
}

// Show modal
function showModal(modalId) {
    modalOverlay.style.display = 'flex';
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.getElementById(modalId).style.display = 'block';
}

// Hide modal
function hideModal() {
    modalOverlay.style.display = 'none';
    emailSuccess.style.display = 'none';
}

// Generate water report
function generateWaterReport() {
    if (waterGoal === 0) {
        alert('Please calculate your water needs first!');
        return;
    }
    
    const today = new Date().toDateString();
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const age = parseInt(document.getElementById('age').value);
    const height = parseFloat(document.getElementById('height').value);
    const activity = document.getElementById('activity').value;
    
    let reportText = `WATER INTAKE REPORT - ${today}\n\n`;
    reportText += `PERSONAL PROFILE\n`;
    reportText += `----------------\n`;
    reportText += `Gender: ${gender.charAt(0).toUpperCase() + gender.slice(1)}\n`;
    reportText += `Age: ${age} years\n`;
    reportText += `Weight: ${weight} kg\n`;
    reportText += `Height: ${height} cm\n`;
    reportText += `Activity Level: ${activity.charAt(0).toUpperCase() + activity.slice(1)}\n`;
    
    reportText += `WATER NEEDS\n`;
    reportText += `-----------\n`;
    reportText += `Daily Water Goal: ${formatVolume(waterGoal)}\n\n`;
    
    reportText += `TODAY'S INTAKE\n`;
    reportText += `--------------\n`;
    reportText += `Total Consumed: ${formatVolume(currentIntake)}\n`;
    const percentage = waterGoal > 0 ? (currentIntake / waterGoal) * 100 : 0;
    reportText += `Progress: ${Math.round(percentage)}%\n`;
    reportText += `Remaining: ${formatVolume(Math.max(0, waterGoal - currentIntake))}\n\n`;
    
    if (intakeLog.length > 0) {
        reportText += `INTAKE LOG\n`;
        reportText += `----------\n`;
        
        // Sort by time (earliest first)
        const sortedLog = [...intakeLog].sort((a, b) => 
            new Date(a.time) - new Date(b.time)
        );
        
        sortedLog.forEach(entry => {
            const time = new Date(entry.time);
            const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            reportText += `${timeStr}: ${formatVolume(entry.amount)}\n`;
        });
    }
    
    reportText += `\n--- Generated by Droplet Water Tracker ---`;
    
    reportContent.textContent = reportText;
    reportWrapper.style.display = 'block';
    return reportText;
}

// Copy report to clipboard
function copyToClipboard() {
    const text = reportContent.textContent;
    
    try {
        navigator.clipboard.writeText(text).then(() => {
            alert('Report copied to clipboard!');
        });
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Report copied to clipboard!');
    }
}

// Email functionality
function sendEmailReport(email) {
    const reportText = generateWaterReport();
    const subject = `Your Water Intake Report - ${new Date().toDateString()}`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportText)}`;
    window.location.href = mailtoLink;
}

// Event listeners
document.getElementById('calculate').addEventListener('click', calculateWaterNeeds);

document.querySelectorAll('.intake-btn[data-amount]').forEach(btn => {
    btn.addEventListener('click', () => {
        const amount = parseInt(btn.getAttribute('data-amount'));
        addWaterIntake(amount);
    });
});

document.getElementById('customIntake').addEventListener('click', () => {
    showModal('customModal');
});

document.getElementById('resetIntake').addEventListener('click', resetIntake);

document.getElementById('addCustomAmount').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('customAmount').value);
    if (amount > 0) {
        addWaterIntake(amount);
        hideModal();
    } else {
        alert('Please enter a valid amount');
    }
});

document.getElementById('emailReport').addEventListener('click', () => {
    if (waterGoal === 0) {
        alert('Please calculate your water needs first!');
        return;
    }
    showModal('emailModal');
});

document.getElementById('sendEmail').addEventListener('click', () => {
    showModal('emailModal');
});

document.getElementById('confirmEmail').addEventListener('click', () => {
    const emailInput = document.getElementById('emailAddress');
    const email = emailInput.value.trim();
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }
    
    if (!email.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }
    
    hideModal();
    sendEmailReport(email);
    showModal('emailSuccess');
    emailInput.value = '';
});

document.getElementById('copyReport').addEventListener('click', copyToClipboard);

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', hideModal);
});

// Close modal when clicking outside
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        hideModal();
    }
});