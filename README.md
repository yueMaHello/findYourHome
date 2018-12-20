# Find Your Home

When a family needs to move to a new city or wants to buy a new house, among thousands of houses, it is difficult to find which one is the most suitable. To decide a new accommodation’s location, several factors must take into account, such as daily travel time, house price, house type and so on. 

This app is an unfinished one, since it only takes travel time into account. We will add more elements into it to optimize the selection algorithm in the future. For now, the app can collect each family member’s diurnal locations and travel methods, then it will show a gravity map to intuitively tell people where is suitable to live based on his information. 

## Set Up:
#### From Github:
1. If you haven't downloaded Nodejs on your computer, you need to download it and add it into PATH.
2. Download this folder
3. Browse to the root of the folder
4. Open the terminal/cmd and go to the root of the App './findYourHome'. 
5. Type 'npm install'
6. Type 'npm intall express --save'
7. Type 'npm install http-errors --save'
8. Put your csv data into './public/data' folder. The data should be a zone-to-zone matrix. 
10. The data must have the same format as the example data located in './public/dataExample/SOV_AUTO_Time_AM_Cr_mf1.csv'.

#### From Lab Computer I
1. Browse to the root of the folder
2. Open the terminal/cmd and go to the root of the App './findYourHome2'. 
3. All the data is stored in './public/data/' folder. If you want to replace the data with the newest record, you should keep the same csv file name so that the App can run properly without changing any code.

## Run
1. Use terminal/cmd to go to the root of the App './findYourHome2'. 
2. Type 'npm start'
2. Browse 'http://localhost:3035' 

## Use Tips:
#### Why there are a lot of HTML code inside the selectionPanel.js
For example, if the user inputs '4' in the number of people, the app will generate four sections for personal information collection and address collection. If there is only 2 people in his home, the app will only generate two groups of other information.
This is the reason that the App will add many html elements based on the answer of the user.

#### The use of 'readData.js':
1. To read these three csv files together may block the browser for a long time.
2. The WebWorker is used to load each csv file in a seperate thread
3. When the user opens this App, the App will use another thread to load CSV files parrallelly.
4. Though there is a loading symbol shown in the web page, the user actually still can answer the questions. 

#### If you want to update the TravelZoneLayer shape file:
 1. The map layer is not stored in localhost. It is stored in the arcgis online server.
 2. In './public/javascript/selectionPanel.js', you can find the current travel zone layer: 'https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0'. If you want to change it to another layer, you can create you own arcgis online account and upload the layer to the arcgis server. You need to replace the url into a new one. You can also ask Sandeep to access Yue Ma's arcgis account.

#### Woops, the App can't run after changing a new dataset:
 1. You need to restart the App server from terminal/cmd (Rerun 'npm start').
