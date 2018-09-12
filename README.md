# Find Your Home
This is a Nodejs web application using Arcgis Javascript API. It will display a survey asking the user some questions. After collecting all the information, the app will show you where you should choose to build a home.

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
2. Browse 'http://localhost:3035' or 'http://162.106.202.155:3035'

## Use tips:
#### Why there are several 'read***.js' scripts in './public/javascripts/' folder :
1. To read these three csv files together may take a long time.
2. The WebWorker is used to load each csv file in a seperate thread. 
3. For example, readAuto.js is to read 'SOV_AUTO_TIME_AM_Cr_mf1.csv'
4. When the user browse this App, the App will use three other threads to load CSV files parrallelly. It can save time.

#### If you want to update the TravelZoneLayer shape file:
 1. The map layer is not stored in localhost. It is stored in the arcgis online server.
 2. In './public/javascript/selectionPanel.js', you can find the current travel zone layer: 'https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0'. If you want to change it to another layer, you can create you own arcgis online account and upload the layer to the arcgis server. You need to replace the url into a new one. You can also ask Sandeep to access Yue Ma's arcgis account.

#### Woops, the App can't run after changing a new dataset:
 1. You need to restart the App server from terminal/cmd (Rerun 'npm start').
