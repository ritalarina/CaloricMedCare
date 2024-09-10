const { ipcRenderer } = require('electron');
let nutritionData = [];
let inputsFilled = {
    'age': false,
    'weight': false,
    'burns': false,
    'days-after-trauma': false, // Use 'days-after-trauma'
    'temperature': false,
    'vco2': false
};

// Define coefficients
const intubationCoefficient = {
    'yes': 1.2, // Example coefficient for intubation
    'no': 1
};

const necroctomyCoefficient = {
    'early': 1.1, // Example coefficient for early necroctomy
    'late': 1.2 // Example coefficient for late necroctomy
};

const noValidationNeeded = new Set(['nutrition', 'intubation', 'necro-phase', 'illness']);

ipcRenderer.on('nutrition-data', (event, data) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");
        const nutritionSelect = document.getElementById("nutrition");

        // Clear previous options
        nutritionSelect.innerHTML = '';

        const nutrients = xmlDoc.getElementsByTagName("nutrition");
        if (nutrients.length === 0) {
            console.error('No nutrition data found.');
            return;
        }

        Array.from(nutrients).forEach(nutrition => {
            const name = nutrition.getElementsByTagName("name")[0].textContent;
            const caloricDensity = parseFloat(nutrition.getElementsByTagName("caloricDensity")[0].textContent); // kcal per 100 g
            nutritionData.push({ name, caloricDensity });
            const option = document.createElement("option");
            option.textContent = name;
            option.value = caloricDensity; // Store caloric density per 100g in the value
            nutritionSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error parsing XML:', error);
    }
});

document.querySelectorAll('input, select').forEach(element => {
    element.addEventListener('input', handleInputChange);
    element.addEventListener('change', handleInputChange);
});

function requiresValidation(id) {
    return !noValidationNeeded.has(id);
}

function handleInputChange() {
    const id = this.id;
    console.log(`Input changed: ${id}`); // Log input change

    if (!requiresValidation(id)) {
        inputsFilled[id] = true;
    } else if (validateField(id)) {
        inputsFilled[id] = true;
    } else {
        inputsFilled[id] = false;
    }

    console.log(`Inputs Filled:`, inputsFilled); // Log filled status
    if (areAllInputsFilled()) {
        calculate();
    }
}

function validateField(id) {
    if (!requiresValidation(id)) {
        return true; // No validation needed for drop-downs
    } else {
        const min = getMinValue(id);
        const max = getMaxValue(id);
        return validateNumber(id, min, max) !== null;
    }
}

function validateNumber(id, min, max) {
    const inputElement = document.getElementById(id);
    const errorSpan = document.getElementById(`${id}-error`);

    if (!inputElement || !errorSpan) {
        console.error(`Element with id "${id}" or error span "${id}-error" not found.`);
        return null;
    }

    const value = parseFloat(inputElement.value);

    if (isNaN(value) || value < min || value > max) {
        errorSpan.textContent = `Value must be between ${min} and ${max}`;
        return null;
    } else {
        errorSpan.textContent = '';
        return value;
    }
}

function getMinValue(id) {
    switch (id) {
        case 'age': return 0;
        case 'weight': return document.getElementById('weight-unit').value === 'kg' ? 1 : 2.2;
        case 'burns': return 1;
        case 'days-after-trauma': return 0;
        case 'temperature': return document.getElementById('temperature-unit').value === 'celsius' ? 24 : 75.2;
        case 'vco2': return 0.1;
    }
}

function getMaxValue(id) {
    switch (id) {
        case 'age': return 120;
        case 'weight': return document.getElementById('weight-unit').value === 'kg' ? 300 : 660;
        case 'burns': return 100;
        case 'days-after-trauma': return Infinity;
        case 'temperature': return document.getElementById('temperature-unit').value === 'celsius' ? 46 : 114.8;
        case 'vco2': return 8;
    }
}

function areAllInputsFilled() {
    return Object.values(inputsFilled).every(value => value === true);
}

function calculate() {
    const age = parseFloat(document.getElementById('age').value);
    const weightUnit = document.getElementById('weight-unit').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const burns = parseFloat(document.getElementById('burns').value);
    const daysAfterTrauma = parseFloat(document.getElementById('days-after-trauma').value);
    const temperatureUnit = document.getElementById('temperature-unit').value;
    const temperature = parseFloat(document.getElementById('temperature').value);
    const vco2 = parseFloat(document.getElementById('vco2').value);

    const selectedNutrition = document.getElementById('nutrition').value;
    const intubation = document.getElementById('intubation').value;
    const necroctomy = document.getElementById('necro-phase').value;

    if (!selectedNutrition) {
        console.error('No nutrition selected.');
        return;
    }

    const caloricDensity = parseFloat(selectedNutrition); // kcal per 100 g

    // Apply coefficients based on drop-down selections
    const intubationCoef = intubationCoefficient[intubation] || 1;
    const necroctomyCoef = necroctomyCoefficient[necroctomy] || 1;

    const caloricNeed = calculateCalories(age, weight, burns, daysAfterTrauma, vco2, temperature) * intubationCoef * necroctomyCoef;
    document.getElementById('caloric-output').textContent = caloricNeed.toFixed(2);

    // Calculate grams of nutrition needed
    const gramsRequired = (caloricNeed / caloricDensity) * 100; // Since caloric density is per 100 g
    document.getElementById('volume-output').textContent = gramsRequired.toFixed(2) + " g";
}

function calculateCalories(age, weight, burns, daysAfterTrauma, vco2, temperature) {
    // Random formula to calculate daily caloric requirement
    return (age * 10) + (weight * 8) + (burns * 12) + (daysAfterTrauma * 5) + (vco2 * 15) + (temperature * 3);
}