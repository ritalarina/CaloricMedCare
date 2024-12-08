# CaloricMedCare

## Description
**CaloricMedCare** is a tool designed for medical professionals to calculate the caloric needs and nutritional intake of burn patients. This application takes patient data, calculates daily caloric requirements using established formulas, and determines the required nutrition formula volumes.

## Input
  - **Gender** (Male/Female)
  - **Age** (0-120 years)
  - **Weight** (1-300 kg, precision up to 0.1 kg)
  - **Height** (50-300 cm)
  - **Body Temperature** (in °C, precision up to 0.1°C)
  - **Total Burn Surface Area** (1-100%)
  - **Days Since Trauma** (0 or more days)
  - **Enteral nutrition day** (0 or more days)
  - **Energy Intake** (500-5000 kcal)
  - **Other Conditions** (multiple-choice options)
  - **Feeding speed** (will recommend speed by default, other options are 25 ml/h, 50 ml/h, 80 ml/h)

## Output
- **BMR Calculation**: Calculates Basal Metabolic Rate (BMR) using the **Harris-Benedict formula**.
- **Kcal Requirement**: Calculates daily caloric intake using the **Toronto formula for major burns**.
- **Protein Requirement**:
  - 1.5-2 g protein per kg of body weight for 1-15 days post-trauma.
  - 1.2-1.5 g protein per kg of body weight after 15 days.
- **Nutrition Volume**: Based on patient data, the algorithm selects nutrition formulas, determines their feeding order and calculates amount of each so that the total calories and proteins fit within 10% of the daily need.
- **Total Volume**: Total volume of nutrition formulas.
- **Total Calories**: Total calories provided by the formulas.
- **Total Protein**: Total protein amount from the formulas.
- **Difference (%)**: The percentage difference between the calculated totals and the patient’s required intake. Deviations over 10% are highlighted in red.
- **Recommended Feeding Speed**: Selected based on enteral nutrition day and presence of malnutrition. Can be changed to other feeding speed if needed.
   - In case of malnutrtion, recommended feeding speed will be 25 ml/h on days 0-2 of enteral nutrition, 50 ml/h on days 3-5 of enteral nutrition and 80 ml/h afterwards.
   - In other cases recommended feeding speed will be 50 ml/h in the first day of enteral nutritions and 80 ml/h afterwards.
- **Needs met at chosen feeding speed**: Calculates total volume, protein and calories fed to the patient in 24h at chosen feeding speed taking into account order of feeding.

### About the algorithm
To calculate volume of each nutrition needed linear programming is used to minimize total nutrition volume while sticking to certain constraints:
- sum of calories provided by all nutrition formulas is &#177;10% of the total required by patient,
- the total amount of protein provided by all nutrition formulas is either equal to or up to 10% less than the total protein required by the patient,
- protein powder quantity is limited to a maximum of 15g (educated guess),
- small drinks with formula are limited to a maximum 3 bottles (600 ml) as per manufactirer instructions,
- if such calculation is possible then recommended volume of each nutrition will be at least half a smallest package to make it economic, if not, calculation is performed with no lower limits,
- for each other health condition a patient has, a special nutrition formula is added to the nutrition mix. If calculation becomes impossible, lower bounds are ignored and some nutrition formulas might be skipped,
- if all else fails, protein constraint can be relaxed down to 85% of the minimum protein need and caloric constraint can be relaxed to be a maximum of 125% of caloric need. This happens in rare cases for patients with small total burn area. You will be indormed if this happens

## Running the app
### Option 1. Running the App from a Published Release
1. Go to the [Releases](https://github.com/ritalarina/caloricmedcare/releases) page and download the latest release for Windows (e.g., .exe file).
2. Once downloaded, run the installer and follow the instructions.
3. Launch the app after installation.

### Option 2. Running the App from Source
1. Open command prompt.
2. Navigate to desired folder.
3. Clone the repository:
   ```bash
   git clone https://github.com/ritalarina/caloricmedcare
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
6. Run the app:
   ```bash
   npm start
   ```
## Usage
Once the app is running, input the following data to calculate patient caloric needs and nutrition requirements:
1. Enter the patient's gender, age, weight, height, body temperature, and burn surface area. Specify the number of days since the trauma and other conditions.
2. Once all input fields are complete, the app will automatically calculate 
   - Basal Metabolic Rate (BMR), 
   - necessary kcal intake during treatment, 
   - protein requirements, 
   - set of nutrition formulas and their volumes necessary to fulfill necessary daily caloric and protein requirements,
   - recommended feeding speed,
   - volume, calories and protein patient is going to consume at recommended feeding speed.

## Contributing
- Have questions or ideas? Join our [Telegram Channel](https://t.me/+gHYkZ2fRgeBmNmE0) to discuss with the community!
- Check out the [TODO](https://github.com/ritalarina/caloricmedcare/blob/master/TODO.md) file to see what's planned.
- If you want to contribute to this project, feel free to open issues or submit pull requests.
- I am currently working using GitHub Flow method (master and feature branches), so if you want to make a feature, make a new branch and when ready merge it back to master.

## License
This project is licensed under the GPL 3.0 License.

## Credits
- The app created based on an idea of Larisa Ramoniene and with her help.
- The app is used and tested by the Latvian National Burn Center (Slimnīca "Biķernieki", Riga, Latvia).
- Icon used in this app is by [Freepik - Flaticon](https://www.flaticon.com/free-icons/nutrient).
