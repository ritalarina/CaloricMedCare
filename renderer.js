const { ipcRenderer } = require('electron');
let nutritionData = [];
let inputsFilled = {
    'age': false,
    'weight': false,
    'burns': false,
    'days-after-trauma': false, // Use 'days-after-trauma'
    'temperature': false,
	'height': false,
	'energy-intake': false
};

const noValidationNeeded = new Set(['illness', 'gender', 'nutrition']);

ipcRenderer.on('nutrition-data', (event, data) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");
        const nutritionSelect = document.getElementById("nutrition");
		const illnessesContainer = document.getElementById("illnesses-container"); 

        // Clear previous options
        nutritionSelect.innerHTML = '';
		illnessesContainer.innerHTML = ''; // Clear the illness drop-down
		
		const illnessSet = new Set(); // Using a Set to avoid duplicate illnesses

        const nutrients = xmlDoc.getElementsByTagName("nutrition");
        if (nutrients.length === 0) {
            console.error('No nutrition data found.');
            return;
        }

        Array.from(nutrients).forEach(nutrition => {
            const name = nutrition.getElementsByTagName("name")[0].textContent;
            const caloricDensity = parseFloat(nutrition.getElementsByTagName("caloricDensity")[0].textContent); // kcal per 100 g
			const protein = parseFloat(nutrition.getElementsByTagName("protein")[0].textContent); // g per 100 ml
            const indication = nutrition.getElementsByTagName("indication")[0].textContent;
            const contraindication = nutrition.getElementsByTagName("contraindication")[0].textContent;
            const nutritionForm = nutrition.getElementsByTagName("form")[0].textContent; // Changed to nutritionForm
            const src = nutrition.getElementsByTagName("src")[0].textContent;
			
			 // Get packaging volumes
            const volumes = Array.from(nutrition.getElementsByTagName("volume")).map(vol => parseInt(vol.textContent));
			
             // Store nutrition data
            nutritionData.push({ 
                name, 
                caloricDensity, 
                protein, 
                indication, 
                contraindication, 
                packaging: volumes, 
                nutritionForm, // Updated to use nutritionForm
                src 
            });
			
            const option = document.createElement("option");
            option.textContent = name;
            option.value = caloricDensity; // Store caloric density per 100g in the value
            nutritionSelect.appendChild(option);
			
			// Add indications to the Set for unique illness options
            if (indication !== "none") {
                illnessSet.add(indication);
            }
        });
		
		// Populate illness checkboxes
        illnessSet.forEach(indication => {
            const checkboxWrapper = document.createElement("div");
            checkboxWrapper.className = "checkbox-wrapper"; // Optional: for styling
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = indication;
            checkbox.name = "illnesses";
            checkbox.value = indication;
            
            const label = document.createElement("label");
            label.htmlFor = indication;
            label.textContent = indication;
            
            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(label);
            
            illnessesContainer.appendChild(checkboxWrapper);
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
        case 'weight': return 1;
        case 'burns': return 1;
        case 'days-after-trauma': return 0;
        case 'temperature': return 24;
		case 'height': return 50;
		case 'energy-intake': return 500;
    }
}

function getMaxValue(id) {
    switch (id) {
        case 'age': return 120;
        case 'weight': return 300;
        case 'burns': return 100;
        case 'days-after-trauma': return Infinity;
        case 'temperature': return 46;
		case 'height': return 300;
		case 'energy-intake': return 5000;
    }
}

function areAllInputsFilled() {
    return Object.values(inputsFilled).every(value => value === true);
}

function calculate() {
    const age = parseFloat(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const burns = parseFloat(document.getElementById('burns').value);
    const daysAfterTrauma = parseFloat(document.getElementById('days-after-trauma').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
	const gender = document.getElementById('gender').value;
	const height = parseFloat(document.getElementById('height').value);
	const energyIntake = parseFloat(document.getElementById('energy-intake').value);

    const selectedNutrition = document.getElementById('nutrition').value;

    if (!selectedNutrition) {
        console.error('No nutrition selected.');
        return;
    }
	
    const caloricDensity = parseFloat(selectedNutrition); // kcal per 100 g
	
	const bmr = calculateBMR(gender, weight, height, age);
	document.getElementById('bmr-output').textContent = Math.round(bmr);

    const caloricNeed = calculateCalories(burns, energyIntake, bmr, temperature, daysAfterTrauma);
    document.getElementById('caloric-output').textContent = Math.round(caloricNeed);
	
	const proteinNeed = calculateProtein(weight, daysAfterTrauma);
    document.getElementById('protein-output').textContent = Math.round(proteinNeed);

    // Calculate nutrition needed
    const nutritionRequired = (caloricNeed / caloricDensity) * 100; // Since caloric density is per 100 g or ml
    document.getElementById('nutrition-output').textContent = Math.round(nutritionRequired);
}

function calculateCalories(burns, energyIntake, bmr, temperature, daysAfterTrauma) {
    // following Toronto formula for major burns
    return -4343 + (10.5 * burns) + (0.23 * energyIntake) + (0.84 * bmr) + (114 * temperature) - (4.5 * daysAfterTrauma);
}

function calculateBMR(gender, weight, height, age) {
	// BMR - Basal Metabolic Rate aka Harris-Benedict
	if (gender === 'male') {
		return 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age);
	} else {
		return 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
	}
}

function calculateProtein(weight, daysAfterTrauma) {
	if (daysAfterTrauma <= 15) {
		return weight * 2;
	} else {
		return weight * 1.5;
	}
}