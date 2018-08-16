# General Heatmap
This is a Nodejs web application using Arcgis Javascript API. It is a simple tool which can be modified to display any zone-to-zone matrix.
## Set Up:
#### From Github:
1. If you haven't downloaded Nodejs on your computer, you need to download it and add it into PATH.
2. Download this folder
3. Browse to the root of the folder
4. Open the terminal/cmd and go to the root of the App './generalHeatmap'. 
5. Type 'npm install'
6. Type 'npm intall express --save'
7. Type 'npm install http-errors --save'
8. Type 'npm install fs --save'
9. Put your csv data into './public/data' folder. Only one csv file is allowed in that folder, so you need to delete any other csv file. The data should be a zone-to-zone matrix. You can name the csv file to anything you want, and the App will show you a title with that csv file name. For example, if you put 'Auto Travel.csv' into the data folder, then the App will be named as 'Auto Travel' when browsing it.
10. The data must have the same format as the example data located in './public/dataExample/Auto Time.csv'.
#### From Lab Computer I
1. Browse to the root of the folder
2. Open the terminal/cmd and go to the root of the App './generalHeatmap'. 
3. Put your csv data into './public/data' folder. Only one csv file is allowed in that folder, so you need to delete any other csv file. The data should be a zone-to-zone matrix. You can name the csv file to anything you want, and the App will show you a title with that csv file name. For example, if you put 'Auto Travel.csv' into the data folder, then the App will be named as 'Auto Travel' when browsing it.
4. The data must have the same format as the example data located in './public/dataExample/Auto Time.csv'. If you browse the csv file through Excel, [0,0] should be empty, but not something like 'z/z'. If your [0,0] is not empty, you have to manually delete it.
## Run
1. Use terminal/cmd to go to the root of the App './generalHeatmap'. 
2. Type 'npm start'
2. Browse 'http://localhost:3033'

## Use tips:
#### If you want to duplicate the App, change the dataset, and render the App at another port other than '3033':
 1. Copy and paste all the content into a new folder
 2. Change the dataset located in 'public/data' into anther one.
 3. Open 'bin/www.js' file, and search for '3033'
 4. Simply change '3033' to other number (3036, 5025, 4022 or such).
 5. Then, just follow the procedure in 'Run'

#### If you want to update the TravelZoneLayer shape file:
 1. The map layer is not stored in localhost. It is stored in the arcgis online server.
 2. In './public/javascript/test.js', you can find the current travel zone layer: 'https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=8gOmRemAl8guD3WA_rfLwe50SgsEvaZzIcXIraH9xC3NQPCLraLwcHIkz3osWU-SHUdSKO1N6rCnWDF_CzWLFlFFUCeugETS44f409SsCtX9eC-HoX0dkXZj2vQD1SsboTGNgAzLDtG-BfIv0FnlWBNqq84hC5a6e7lj2Tt1oV8V0WxGiCE7rtaXgxZr18TZur-l_T6gWW2jDh1mt5q0mqty8vc133DvOtg5JhtGm8OTdn9rYtscRKu66B153RYB'. If you want to change it to another layer, you can create you own arcgis online account and upload the layer to the arcgis server. You need to replace the url into a new one. You can also ask Sandeep to access Yue Ma's arcgis account.
#### If you want to change the legend:
1. Open './public/test.js' file, search 'readerer.addBreak' to show that part of code.
2. Right now, the break points all are calculated based on data of zone[101]. It can adjust the legend to suit different dataset. If you want to change the break points, you could just manually change 'sort[chunkZone]' to some specific value. 
      For exampe:
      * renderer.addBreak(0, 70, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.90])));
      * renderer.addBreak(70, 150, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([249, 238, 237,0.90])));
#### If you want to change the legend color:
1. Open './public/test.js' file, search 'readerer.addBreak' to show that part of code.
2. Change 'new Color([255, 255, 255,0.90])' to some other RGB color.
      
#### Woops, the App can't run after changing a new dataset:
 1. You need to restart the server from terminal/cmd (Rerun 'npm start').
