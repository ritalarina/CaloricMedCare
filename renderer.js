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
let filteredFormulas = [];

const noValidationNeeded = new Set(['illness', 'gender', 'feeding-speed-selector']);

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
            illnessSet.add("malnutrition (high refeeding risk)");
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

    const value = parseFloat(inputElement.value);

    if (isNaN(value) || value < min || value > max) {
        errorSpan.textContent = `Value must be between ${min} and ${max}`;
        emptyNutritionTable();
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
        case 'enteral-nutrition-day': return 0;
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
        case 'enteral-nutrition-day': return Infinity;
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
    const selectedSpeed = document.getElementById('feeding-speed-selector').value;
    const enteralNutritionDay = document.getElementById('enteral-nutrition-day').value;

    const errorSpan = document.getElementById(`nutrition-table-error`);
    errorSpan.textContent = '';

    const bmr = calculateBMR(gender, weight, height, age);
    document.getElementById('bmr-output').textContent = Math.round(bmr);

    caloricNeed = calculateCalories(burns, energyIntake, bmr, temperature, daysAfterTrauma);
    document.getElementById('caloric-output').textContent = Math.round(caloricNeed);

    const [minProtein, maxProtein] = calculateProtein(weight, daysAfterTrauma);
    document.getElementById('protein-output').textContent = Math.round(minProtein) + '-' + Math.round(maxProtein);

    filterNutritionFormulas(daysAfterTrauma);

    let results = calculateNutritionVolumes(minProtein, maxProtein);
    let totals = {};
    const validStatuses = [glpk.GLP_OPT, glpk.GLP_FEAS];
    const fallbackScenarios = [
        { newFormulas: ["Nutridrink", "Protifar", "Nutrison"] },
        { params: [1, 1, true, false] },
        { params: [1, 1, true, true] },
        { params: [0.9, 1, true, true] },
        { params: [0.9, 1.2, true, true] },
        { params: [0.85, 1.25, true, true] },
    ];

    for (const scenario of fallbackScenarios) {
        if (validStatuses.includes(results.status)) break;

        if (scenario.newFormulas) {
            const newFormulas = nutritionData.filter(nutrition =>
                scenario.newFormulas.includes(nutrition.name)
            );
            filteredFormulas.push(...newFormulas);
        }

        if (scenario.params) {
            results = calculateNutritionVolumes(minProtein, maxProtein, ...scenario.params);
        }
    }

    // Handle failure case
    if (!validStatuses.includes(results.status)) {
        emptyNutritionTable();
        errorSpan.textContent = `Calculation failed. Take a screenshot and send it to the developer.`;
    } else {
        totals = getTotals(results);
        populateNutritionTableWithResults(results, totals);
    }

    calculateFeedingSpeed(selectedSpeed, enteralNutritionDay, totals.totalLiquidQuantity + totals.totalPowderQuantity, totals.totalCalories, totals.totalProtein);
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
        return [weight * 1.5, weight * 2]; // [minProtein, maxProtein]
    } else {
        return [weight * 1.2, weight * 1.5]; // [minProtein, maxProtein]
    }
}

function filterNutritionFormulas(daysAfterTrauma) {
    const selectedIllnesses = getSelectedIllnesses();

    filteredFormulas = [nutritionData.find(nutrition => nutrition.name === "Nutrison Protein Intense")];

    if (daysAfterTrauma <= 15) {
        filteredFormulas.push(nutritionData.find(nutrition => nutrition.name === "Nutricomp Glutamine+"));
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

function populateNutritionTableWithResults(results, totals) {
    const tableBody = emptyNutritionTable(); // Clear existing rows

    results.volumes.forEach(result => {
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
            caloriesCell.textContent = Math.round(result.calories) + ' kcal';
            row.appendChild(caloriesCell);

            // Provided protein
            const proteinCell = document.createElement('td');
            proteinCell.textContent = Math.round(result.protein) + ' g';
            row.appendChild(proteinCell);

            // Append row to table
            tableBody.appendChild(row);
        }
    });

    // Insert totals into the footer row
    document.getElementById('totalCalories').textContent = Math.round(totals.totalCalories) + ' kcal';
    document.getElementById('totalProtein').textContent = Math.round(totals.totalProtein) + ' g';
    document.getElementById('totalQuantity').innerHTML = Math.round(totals.totalLiquidQuantity) + ' ml' + ((Math.round(totals.totalPowderQuantity) > 0) ? '<br>+<br>' + Math.round(totals.totalPowderQuantity) + ' g' : '');

    const caloriesDiffCell = document.getElementById('caloriesDiff');
    const proteinDiffCell = document.getElementById('proteinDiff');

    caloriesDiffCell.textContent = totals.pctDiffCalories === 0 ? '' : (totals.pctDiffCalories > 0 ? '+' : '') + totals.pctDiffCalories + '%';
    proteinDiffCell.textContent = totals.pctDiffProtein === 0 ? '' : (totals.pctDiffProtein > 0 ? '+' : '') + totals.pctDiffProtein + '%';

    // Add red color class if difference exceeds 10%
    caloriesDiffCell.classList.toggle('high-difference', Math.abs(totals.pctDiffCalories) > 10);
    proteinDiffCell.classList.toggle('high-difference', Math.abs(totals.pctDiffProtein) > 10);
}

function emptyNutritionTable() {
    const tableBody = document.querySelector('#nutrition-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    const elementIds = ['totalCalories', 'totalProtein', 'totalQuantity', 'caloriesDiff', 'proteinDiff'];
    elementIds.forEach(id => {
        document.getElementById(id).textContent = '';
    });

    return tableBody;
}

function calculateNutritionVolumes(minProtein, maxProtein, minProteinCoeff = 1, maxCaloriesCoeff = 1, ignoreSomeLimits = false, ignoreAllLimits = false) {
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
                bnds: { type: glpk.GLP_DB, lb: 0.9 * caloricNeed, ub: maxCaloriesCoeff * caloricNeed }
            },
            {
                name: "protein_constraint",
                vars: filteredFormulas.map((nutrition, index) => ({
                    name: `x${index}`,
                    coef: nutrition.protein / 100 // grams/ml
                })),
                bnds: { type: glpk.GLP_DB, lb: minProteinCoeff * minProtein, ub: maxProtein }
            }
        ],
        bounds: filteredFormulas.map((nutrition, index) => ({
            name: `x${index}`,
            type: glpk.GLP_DB,
            lb: (nutrition.nutritionForm === 'liquid') ? (((ignoreSomeLimits && (nutrition.indication == 'none')) || ignoreAllLimits) ? 0 : Math.min(...nutrition.packaging) / 2) : 0,
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

    let results = {};

    if (result.result.status === glpk.GLP_OPT) {
        const volumes = Object.keys(result.result.vars).map((key, index) => {
            const variable = result.result.vars[key];

            return {
                nutrition: filteredFormulas[index].name,
                volume: variable,
                calories: variable * filteredFormulas[index].caloricDensity / 100,
                protein: variable * filteredFormulas[index].protein / 100,
                units: (filteredFormulas[index].nutritionForm === 'powder') ? 'g' : 'ml',
                nutritionForm: filteredFormulas[index].nutritionForm
            };
        });

        console.log(volumes);

        // Sort volumes by feedingPriority and then by name in case of ties
        volumes.sort((a, b) => {
            if (a.feedingPriority !== b.feedingPriority) {
                return a.feedingPriority - b.feedingPriority;
            }
            return a.nutrition.localeCompare(b.nutrition);
        });

        results = {
            status: result.result.status,
            volumes: volumes,
            minProtein: minProtein,
            maxProtein: maxProtein
        }

    } else {
        results = {
            status: result.result.status
        }
    }

    console.log(results);

    return results;
}

function getTotals(results) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalLiquidQuantity = 0;
    let totalPowderQuantity = 0;
    let pctDiffProtein = 0;

    results.volumes.forEach(result => {
        if (result.volume > 0) {
            totalCalories += result.calories;
            totalProtein += result.protein;
            if (result.nutritionForm === 'powder') {
                totalPowderQuantity += result.volume;
            } else {
                totalLiquidQuantity += result.volume;
            }
        }
    });

    const pctDiffCalories = Math.round(totalCalories * 100 / caloricNeed - 100);

    const maxProtein = results.maxProtein;
    const minProtein = results.minProtein;
    if (totalProtein > maxProtein) {
        pctDiffProtein = Math.round(totalProtein * 100 / maxProtein - 100);
    } else if (totalProtein < minProtein) {
        pctDiffProtein = Math.round(totalProtein * 100 / minProtein - 100);
    }

    const totals = {
        totalCalories,
        totalProtein,
        totalLiquidQuantity,
        totalPowderQuantity,
        pctDiffCalories,
        pctDiffProtein
    };

    return totals;
}

function calculateFeedingSpeed(selectedSpeed, enteralNutritionDay, totalVolume, totalCalories, totalProtein) {
    let feedingSpeed;
    let selectedIllnesses = getSelectedIllnesses();
    if (selectedSpeed === "recommended") {
        if (selectedIllnesses.some(illness => illness.includes('malnutrition'))) {  // if option that contains string 'malnutrition' is selected
            feedingSpeed = 25;
        } else {
            if (enteralNutritionDay < 3) feedingSpeed = 50;
            else feedingSpeed = 80;
        }
    }
    else feedingSpeed = selectedSpeed;
    const speedFactor = feedingSpeed * 24 / totalVolume;

    const caloriesConsumed = Math.round(totalCalories * speedFactor);
    const proteinConsumed = Math.round(totalProtein * speedFactor);

    const caloriesDeficit = Math.round(totalCalories - caloriesConsumed);
    const proteinDeficit = Math.round(totalProtein - proteinConsumed);

    // Update the feeding speed section
    document.getElementById("feeding-speed-value").textContent = `${feedingSpeed} ml/hour`;
    document.getElementById("calories-consumed-value").textContent = `${caloriesConsumed} kcal`;
    document.getElementById("protein-consumed-value").textContent = `${proteinConsumed} g`;

    document.getElementById("calories-deficit-value").textContent = `${caloriesDeficit} kcal`;
    document.getElementById("protein-deficit-value").textContent = `${proteinDeficit} g`;

    // Highlight deficits if >10%
    document.getElementById("calories-deficit-value").classList.toggle("deficit", Math.abs(caloriesDeficit) > 0.1 * totalCalories);
    document.getElementById("protein-deficit-value").classList.toggle("deficit", Math.abs(proteinDeficit) > 0.1 * totalProtein);
};
