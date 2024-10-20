const { ipcRenderer } = require('electron');
const GLPK = require('glpk.js');
const glpk = GLPK();

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
let caloricNeed;
let proteinNeed;
let filteredFormulas = [];

const noValidationNeeded = new Set(['illness', 'gender']);

ipcRenderer.on('nutrition-data', (event, data) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "application/xml");
        const illnessesContainer = document.getElementById("illnesses-container");

        // Clear previous options
        illnessesContainer.innerHTML = ''; // Clear the illness drop-down

        const illnessSet = new Set(); // Using a Set to avoid duplicate illnesses

        const nutrients = xmlDoc.getElementsByTagName("nutrition");
        if (nutrients.length === 0) {
            console.error('No nutrition data found.');
            return;
        } 0

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
                nutritionForm,
                src
            });

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

        addCheckboxListeners();
    } catch (error) {
        console.error('Error parsing XML:', error);
    }
});

document.querySelectorAll('input, select').forEach(element => {
    element.addEventListener('input', handleInputChange);
    element.addEventListener('change', handleInputChange);
});

function addCheckboxListeners() {
    const illnessCheckboxes = document.querySelectorAll('input[name="illnesses"]');

    // Attach event listeners to each checkbox
    illnessCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            handleInputChange();
        });
    });
}

function handleInputChange() {
    const id = this.id;
    if (id) {
        console.log(`Input changed: ${id}`); // Log input change

        if (validateField(id)) {
            inputsFilled[id] = true;
        } else {
            inputsFilled[id] = false;
        }
    }

    let areAllInputsFilled = Object.values(inputsFilled).every(value => value === true);
    if (areAllInputsFilled) {
        calculate();
    }
}

function validateField(id) {
    if (noValidationNeeded.has(id)) {
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

function calculate() {
    const age = parseFloat(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const burns = parseFloat(document.getElementById('burns').value);
    const daysAfterTrauma = parseFloat(document.getElementById('days-after-trauma').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const gender = document.getElementById('gender').value;
    const height = parseFloat(document.getElementById('height').value);
    const energyIntake = parseFloat(document.getElementById('energy-intake').value);

    const errorSpan = document.getElementById(`nutrition-table-error`);
    errorSpan.textContent = '';

    const bmr = calculateBMR(gender, weight, height, age);
    document.getElementById('bmr-output').textContent = Math.round(bmr);

    caloricNeed = calculateCalories(burns, energyIntake, bmr, temperature, daysAfterTrauma);
    document.getElementById('caloric-output').textContent = Math.round(caloricNeed);

    proteinNeed = calculateProtein(weight, daysAfterTrauma);
    document.getElementById('protein-output').textContent = Math.round(proteinNeed);

    filterNutritionFormulas(daysAfterTrauma);

    if (!calculateNutritionVolumes(weight)) {
        filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === 'Nutridrink'));
        if (!calculateNutritionVolumes(weight)) {
            filteredFormulas.pop();
            filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === 'Protifar'));
            if (!calculateNutritionVolumes(weight)) {
                filteredFormulas.pop();
                filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === 'Nutrison'));
                if (!calculateNutritionVolumes(weight)) {
                    filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === 'Protifar'));
                    filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === 'Nutridrink'));
                    if (!calculateNutritionVolumes(weight, true)) {
                        emptyNutritionTable();
                        errorSpan.textContent = `Calculation failed`;
                    }
                }
            }
        }
    }
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
        return weight * 1.8;
    } else {
        return weight * 1.3;
    }
}

function filterNutritionFormulas(daysAfterTrauma) {
    const selectedIllnesses = getSelectedIllnesses();

    filteredFormulas = [nutritionData.find(nutrition => nutrition.name === "Nutrison Protein Intense")];

    if (daysAfterTrauma <= 15) {
        filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === "Glutamine+"));
    }

    selectedIllnesses.forEach(illness => {
        let nutritionName = getNutritionNameByIllness(illness);

        if (nutritionName) {
            filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === nutritionName));
        }
    });
}

function getSelectedIllnesses() {
    let selectedIllnesses = [];
    document.querySelectorAll('input[name="illnesses"]:checked').forEach(checkbox => {
        selectedIllnesses.push(checkbox.value);
    });

    return selectedIllnesses;
}

function getNutritionNameByIllness(illness) {
    switch (illness) {
        case 'diabetes':
            return 'Nutrison Advanced Diason';
        case 'constipation':
            return 'Nutrison Multi Fibre';
        case 'swelling':
            return 'Nutrison Energy Multi Fibre';
        case 'liver failure':
            return 'Nutricomp Hepa';

        default:
            return null;
    }
}

function populateNutritionTableWithResults(results) {
    const tableBody = emptyNutritionTable(); // Clear existing rows

    results.forEach(result => {
        if (result.volume > 0) {
            const row = document.createElement('tr');

            // Nutrition name
            const nameCell = document.createElement('td');
            nameCell.textContent = result.nutrition;
            row.appendChild(nameCell);

            // Required volume
            const volumeCell = document.createElement('td');
            volumeCell.textContent = Math.round(result.volume) + ' ' + result.units;
            row.appendChild(volumeCell);

            // Provided calories
            const caloriesCell = document.createElement('td');
            caloriesCell.textContent = Math.round(result.calories);
            row.appendChild(caloriesCell);

            // Provided protein
            const proteinCell = document.createElement('td');
            proteinCell.textContent = Math.round(result.protein);
            row.appendChild(proteinCell);

            // Append row to table
            tableBody.appendChild(row);
        }
    });
}

function emptyNutritionTable() {
    const tableBody = document.querySelector('#nutrition-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows
    return tableBody;
}

function calculateNutritionVolumes(weight, ignoreLimits = false) {
    const lpProblem = {
        name: 'Nutrition Optimization',
        objective: {
            direction: glpk.GLP_MIN,
            name: 'minimize_volume',
            vars: filteredFormulas.map((nutrition, index) => ({
                name: `x${index}`,
                coef: 1
            }))
        },
        subjectTo: [
            {
                name: 'caloric_constraint',
                vars: filteredFormulas.map((nutrition, index) => ({
                    name: `x${index}`,
                    coef: nutrition.caloricDensity / 100 // kcal/ml 
                })),
                bnds: { type: glpk.GLP_DB, lb: 0.9 * caloricNeed, ub: 1.1 * caloricNeed }
            },
            {
                name: "protein_constraint",
                vars: filteredFormulas.map((nutrition, index) => ({
                    name: `x${index}`,
                    coef: nutrition.protein / 100 // grams/ml
                })),
                bnds: { type: glpk.GLP_DB, lb: 0.9 * proteinNeed, ub: 1.1 * proteinNeed }
            }
        ],
        bounds: filteredFormulas.map((nutrition, index) => ({
            name: `x${index}`,
            type: glpk.GLP_DB,
            lb: (nutrition.nutritionForm === 'liquid') ? ((ignoreLimits && (nutrition.indication == 'none')) ? 0 : Math.min(...nutrition.packaging) / 2) : 0,
            ub: (nutrition.nutritionForm === 'powder') ? 2.5 * 6 : ((nutrition.name === 'Nutridrink') ? 600 : Infinity)
        }))
    };

    console.log("Filtered nutrition formulas for optimization:", filteredFormulas);
    console.log("lpProblem", lpProblem);

    const options = {
        msglev: glpk.GLP_MSG_ERR,
        presol: true
    };

    const result = glpk.solve(lpProblem, options);

    console.log(result);

    if (result.result.status === glpk.GLP_OPT) {
        console.log("Optimal solution found.");
    } else {
        if (result.result.status === glpk.GLP_FEAS) {
            console.log("Feasible solution found, but it might not be optimal.");
        } else if (result.result.status === glpk.GLP_INFEAS) {
            console.log("The problem is infeasible.");
        } else if (result.result.status === glpk.GLP_NOFEAS) {
            console.log("No feasible solution exists.");
        } else if (result.result.status === glpk.GLP_UNBND) {
            console.log("The solution is unbounded.");
        } else if (result.result.status === glpk.GLP_UNDEF) {
            console.log("The solution is undefined.");
        }
        return false;
    }

    const volumes = Object.keys(result.result.vars).map((key, index) => {
        const variable = result.result.vars[key];  // Access the variable by key

        return {
            nutrition: filteredFormulas[index].name,
            volume: variable,  // variable.value is likely just `variable`
            calories: variable * filteredFormulas[index].caloricDensity / 100,
            protein: variable * filteredFormulas[index].protein / 100,
            units: (filteredFormulas[index].nutritionForm === 'powder') ? 'g' : 'ml'
        };
    });

    console.log(volumes);

    // Display the result in the UI
    populateNutritionTableWithResults(volumes);

    return true;
}


