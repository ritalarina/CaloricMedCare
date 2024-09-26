# NutriCalc

## Description
**NutriCalc** is a tool designed for medical professionals to calculate the caloric needs and nutritional intake of burn patients. This application takes patient data, calculates daily caloric requirements using established formulas, and determines the required nutrition formula volumes.

## Input
  - **Gender** (Male/Female)
  - **Age** (0-120 years)
  - **Weight** (1-300 kg, precision up to 0.1 kg)
  - **Height** (50-300 cm)
  - **Body Temperature** (in °C, precision up to 0.1°C)
  - **Total Burn Surface Area** (1-100%)
  - **Days Since Trauma** (0 or more days)
  - **Energy Intake** (500-5000 kcal)
  - **Other Conditions** (multiple-choice options)
  - **Selected Nutrition Formula** (from available formulas)

## Output
- **BMR Calculation**: Calculates Basal Metabolic Rate (BMR) using the **Harris-Benedict formula**.
- **Kcal Requirement**: Calculates daily caloric intake using the **Toronto formula for major burns**.
- **Protein Requirement**:
  - 2g protein per kg of body weight for 1-15 days post-trauma.
  - 1.5g protein per kg of body weight after 15 days.
- **Nutrition Volume**: Calculates the required daily volume of the selected nutrition formula.

## Running the app
### Option 1. Running the App from a Published Release
1. Go to the [Releases](https://github.com/ritalarina/nutricalc/releases) page and download the latest release for Windows (e.g., .exe file).
2. Once downloaded, run the installer and follow the instructions.
3. Launch the app after installation.

### Option 2. Running the App from Source
1. Open command prompt.
2. Navigate to desired folder.
3. Clone the repository:
   ```bash
   git clone https://github.com/ritalarina/caloric-need-calculator
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
2. Choose the appropriate nutrition formula.
3. Once all input fields are complete, the app will automatically calculate the Basal Metabolic Rate (BMR), necessary kcal intake during treatment, protein requirements, and daily volume of nutrition.

## Contributing
- Check out the [TODO](https://github.com/ritalarina/nutricalc/blob/master/TODO.md) file to see what's planned.
- If you want to contribute to this project, feel free to open issues or submit pull requests.
- I am currently working using GitHub Flow method (master and feature branches), so if you want to make a feature, make a new branch and when ready merge it back to master.

## License
This project is licensed under the GPL 3.0 License.

## Credits
Icon used in this app is by [Freepik - Flaticon](https://www.flaticon.com/free-icons/nutrient).
