# CaloricMedCare

## Disclaimer
CaloricMedCare is an open-source tool provided "as-is," without warranties or guarantees of any kind. While it is designed to assist medical professionals in estimating nutritional needs for burn patients, **it is not a certified medical device** under EU or other regulations and should not be relied upon as the sole source of clinical decision-making. Users are responsible for verifying the accuracy of its calculations and for ensuring they align with established medical guidelines and practices. 

The creators of CaloricMedCare assume no liability for any outcomes resulting from the use of this application.

## Description
**CaloricMedCare** is an open-source tool intended to assist with estimating caloric needs and nutritional intake for burn patients. It is designed for research and educational purposes and may be useful as a supplementary resource for healthcare professionals. This app is not certified as a medical device and should not replace professional clinical judgment.

## Usage
Once the app is running, you can input patient-related data to calculate estimated caloric needs and nutrition requirements:
1. Enter the patient's gender, age, weight, height, body temperature, and burn surface area. Specify the number of days since the trauma and other conditions.
2. The app will provide estimates for:
   - Basal Metabolic Rate (BMR),
   - Necessary kcal intake during treatment,
   - Protein requirements,
   - Suggested nutrition formulas and their volumes,
   - Recommended feeding speed, and
   - Estimated volume, calories, and protein intake at the chosen feeding speed.

**Important:** All outputs should be independently reviewed and validated by qualified professionals before use in clinical practice.

### About the algorithm
To calculate volume of each nutrition needed linear programming is used to minimize total nutrition volume while sticking to certain constraints:
- sum of calories provided by all nutrition formulas is &#177;10% of the total required by patient,
- the total amount of protein provided by all nutrition formulas is either equal to or up to 10% less than the total protein required by the patient,
- protein powder quantity is limited to a maximum of 15g (educated guess),
- small drinks with formula are limited to a maximum 3 bottles (600 ml) as per manufactirer instructions,
- if such calculation is possible then recommended volume of each nutrition will be at least half a smallest package to make it economic, if not, calculation is performed with no lower limits,
- for each other health condition a patient has, a special nutrition formula is added to the nutrition mix. If calculation becomes impossible, lower bounds are ignored and some nutrition formulas might be skipped,
- if all else fails, protein constraint can be relaxed down to 85% of the minimum protein need and caloric constraint can be relaxed to be a maximum of 125% of caloric need. This happens in rare cases for patients with small total burn area. You will be indormed if this happens

## Languages Supported
CaloricMedCare is available in the following languages:
- English
- Russian
- Latvian

More languages may be added in future updates based on user demand and feedback.

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
- The app was created based on an idea by Larisa Ramoniene, who contributed to its development.
- Icon used in this app is by [Freepik - Flaticon](https://www.flaticon.com/free-icons/nutrient).
