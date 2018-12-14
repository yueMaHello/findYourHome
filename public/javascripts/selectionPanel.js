/*
When a family needs to move to a new city or wants to buy a new house, among thousands of houses, it is difficult to find which one is the most suitable.
To decide a new accommodation’s location, several factors must take into account, such as daily travel time, house price, house type and so on.
This app is an unfinished one, since it only takes travel time into account. We will add more elements into it to optimize the selection algorithm in the future.
For now, the app can collect each family member’s diurnal locations and travel methods, then it will brush show a gravity map to intuitively tell people where is suitable to live.
In the future, house price, house type and preferred location will be taken into account to make the app more usable.

*/
//attribute.District. If you change the district layer's attribute name, this variable should be changed correspondingly
let travelZoneAttributeID = 'TAZ_New';
//record the restart times, if the user click 'restart', then this submitTime will increase
var submitTime = 0;
var map;
var personList;
var restartTime=0;
//it is used to relate number to text
var numberList = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth'];
var householdInfo = {
  totalMembers:null,
  numOfWorkers:null,
  numOfStudents:null,
  houseType:"Any",//Single house, Duplex, Condo, Appartment
  housePriceRange:{
      min:0,
      max:Infinity
  }
};
var connections = [];//map clicking event
function person(index){
    this.index = index;
    this.age = null;
    this.occupation = null;
    this.address = null;
    this.travelMethod = null;
    this.travelResult= null;
}
//an object stores all the csv data
//if you change the csv files' names, you should also change csv names in readData.js
var csvData = {
  auto:{
    directory:"../data/SOV_AUTO_Time_AM_Cr_mf1.csv",
    dataMatrix:null,
    type:'auto'
  },
  transit:{
    directory:"../data/Transit_Total_Time_AM.csv",
    dataMatrix:null,
    type:'transit'
  },
  walk:{
    directory:"../data/Walk_Time_AM_Cr_mf486.csv",
    dataMatrix:null,
    type:'walk'
  },
  distance:{
    directory:"../data/Distance_mf2.csv",
    dataMatrix:null,
    type:'distance'
  }
};
    //detect when the data has been loaded.
  var monitorDataStatus = new Variable(0,function(){
    $('#wait').hide();
  });
  var w;
  //Use another thread to load all the data
  if(window.Worker){
    $('#wait').show();
     w = new Worker("./javascripts/readData.js");
     w.onmessage = function(e){
       csvData = JSON.parse(e.data);
       $('#wait').hide();
      if(submitTime!==0){
        $('#submitWorkpalce').click();
      }
      w.terminate();
    };
     monitorDataStatus.SetValue(monitorDataStatus.GetValue()+1);
}
else{
  //bad browser which doesn't support a seperate worker/thread
  $("#wait").show();
  var q = d3.queue();
  q.defer(d3.csv,csvData.auto.directory)
      .defer(d3.csv,csvData.transit.directory)
        .defer(d3.csv,csvData.walk.directory)
            .defer(d3.csv,csvData.distance.directory)
             .await(finishReadingWithoutWorker);
}
//run everything in the main thread
function finishReadingWithoutWorker(error,auto,transit,walk,distance){
  csvData.auto.dataMatrix=buildMatrixLookup(auto);
  csvData.transit.dataMatrix=buildMatrixLookup(transit);
  csvData.walk.dataMatrix=buildMatrixLookup(walk);
  csvData.distance.dataMatrix=buildMatrixLookup(distance);
  $("#wait").hide();
}

require(["dojo/_base/connect","esri/dijit/Geocoder", "esri/graphic","esri/geometry/Polyline",
  "esri/geometry/Extent","esri/tasks/query","esri/dijit/Popup",
  "esri/dijit/PopupTemplate","dojo/dom","dojo/dom-construct",
  "esri/dijit/BasemapToggle","esri/dijit/Legend","esri/map", "esri/layers/FeatureLayer",
  "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",
  "esri/renderers/ClassBreaksRenderer","esri/symbols/SimpleMarkerSymbol",
  "esri/Color", "dojo/dom-style", "dojo/domReady!"
], function(connect,Geocoder,Graphic,Polyline,Extent,Query,Popup, PopupTemplate,dom,domConstruct,BasemapToggle,Legend,Map, FeatureLayer,
    InfoTemplate, SimpleFillSymbol,SimpleLineSymbol,ClassBreaksRenderer,SimpleMarkerSymbol,Color, domStyle){
    
    map = new Map("map", {
        basemap: "streets",
        center: [-113.4909, 53.5444],
        zoom: 9,
        minZoom:6,
        slider: false
    });
    //travel zone layer
    var travelZoneLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0",{
        mode: FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],

    });
    //LRT layer
    var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0",{
        mode: FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],
    });
    
    map.on('load',function(){
        map.addLayer(travelZoneLayer);
        map.addLayer(lrtFeatureLayer);
        brushLayerWithSingleColor();
    });
    //first submit button
    $('#submitHouseholdInfo').unbind('click').bind('click', function (e){
      //fill household
        $('#personInfo').empty();
        var check = true;
        householdInfo.totalMembers = Number($('#peopleNumber').val());
        if($('#workerNumber').val()){
          householdInfo.numOfWorkers = Number($('#workerNumber').val());
        }
        if($('#studentNumber').val()){
          householdInfo.numOfStudents = Number($('#studentNumber').val());
        }
        householdInfo.houseType = $('#houseType').val();
        if(checkNumber(Number($('#min-price').val()))){
          householdInfo.housePriceRange.min = Number($('#min-price').val());
        }
        if(checkNumber(Number($('#max-price').val()))){
          householdInfo.housePriceRange.max = Number($('#max-price').val());
        }
        if(!checkNumber(householdInfo.totalMembers) || householdInfo.totalMembers<1){
          check=false;
          alert('Please enter a non-zero integer!');
          $('#peopleNumber').css('border-color','red');
        }
        else{
          $('#peopleNumber').css('border-color','grey');
        }
        if(!checkNumber(householdInfo.numOfWorkers)){
          check=false;
          alert('Please enter a non-negative integer!');
          $('#workerNumber').css('border-color','red');

        }
        else{
          $('#workerNumber').css('border-color','grey');
        }
        if(!checkNumber(householdInfo.numOfStudents)){
          check=false;
          alert('Please enter a non-negative integer!');
          $('#studentNumber').css('border-color','red');
        }
        else{
          $('#studentNumber').css('border-color','grey');
        }
        //if all the data has desired format.
        if(check){
          $("#householdColumn").hide();
          $('#personColumn').show();
          fillPersonalInfoPanel();
        }   
    });
    //generate personal info panel based on the household info
    //for example, if there are three people in your home, then there will be three groups shown in this section
    function fillPersonalInfoPanel(){
        for(var i=0;i<householdInfo.totalMembers;i++){
          var divId = i+'personInfo';
          var divAgeId = i+'personAge';
          var divAgeValue = i+'personAgeValue';
          var divOccupId = i+'personOccup';
    
          $('#personInfo').append('<div style="text-align:right; margin-right:40%" id="'+divId+'" ></div>');
          $('#'+divId).append('<h4 style="text-align:left; margin-left:20px">'+numberList[i]+' person:<h4>')
              .append('<label for="'+divAgeId+'">Age:</label>')
              .append('<input type="range" min="1" max="120" value="50" class="slider" style="width:150px" type="text" id="'+divAgeId+'"><p style="margin-top:-20px; margin-left:290px;"><span id="'+divAgeValue+'"></span></p>')
              .append('<br><label for="'+divOccupId+'">Occupation:</label>')
              .append('<select style="width:150px" autocomplete="off" id="'+divOccupId+'"></select>');
          $('#'+divOccupId).append('<option value="other" selected>Other</option>')
              .append('<option value="employee">Employee at Edmonton</option>')
              .append('<option value="student">Student at Edmonton</option><br>');
          
          var slider = document.getElementById(divAgeId);
          var output = document.getElementById(divAgeValue);
          output.innerHTML = slider.value;
          slider.oninput = function(){
            var activeSlider = this.id.split('person')[0];
            var outputId = activeSlider+'personAgeValue';
            document.getElementById(outputId).innerHTML = this.value;
          };
        }
        personList = new Array(householdInfo.totalMembers);
        for(var l=0; l<householdInfo.totalMembers;l++){
          personList[l] = new person(l);
        }
        $('#submitPersonalInfo').unbind('click').bind('click', function (e){
          $('#workplace').empty();
          console.log('clickPersonalSubmit');

          for(var i=0;i<householdInfo.totalMembers;i++){
            var divAgeId = i+'personAge';
            var divOccupId = i+'personOccup';
            personList[i].age = ($('#'+divAgeId).val());
            console.log(personList[i].age);
            personList[i].occupation =($('#'+divOccupId).val());
          }
          $('#personColumn').hide();
          $('#placeColumn').show();
          //show place panel after the user finish personalInfoPanel
          fillPlacePanel();
        });
    }
    //generate place panel
    function fillPlacePanel(){

        function showLocation(evt) {
            activeWorkerOrStudent =Number(evt.target.id.split('_')[0]);
            map.graphics.clear();
            var point = evt.result.feature.geometry;
            var symbol = new SimpleMarkerSymbol().setStyle(
                SimpleMarkerSymbol.STYLE_SQUARE).setColor(
                new Color([255,0,0,0.5])
            );
            var graphic = new Graphic(point, symbol);
            map.graphics.add(graphic);
            var found= false;
            for(var c in travelZoneLayer._graphicsVal){
                if(travelZoneLayer._graphicsVal[c].geometry.contains(point)){
                    personList[activeWorkerOrStudent].address = [travelZoneLayer._graphicsVal[c].attributes[travelZoneAttributeID],point];
                    found = true;
                    break;
                }
            }
        }
        for(let i=0;i<personList.length;i++){
          if(personList[i].occupation!=='other'){
              var divId = i+'workInfo';
              var divGeocoder = i+'_'+restartTime+'workerAddressGeocoder';
              var divMapButton = i+'workerAddressMap';
              var divMapButtonDisable = i+'workerAddressMapDisable';
              var divTravelMethod = i+'workerTravelMethod';

              $('#workplace').append('<div style="text-align:left; margin-left:20px;" id="'+divId+'" ></div>');
              $('#'+divId).append("<h4 style='text-align:left'>"+numberList[i]+" person:<h4>")
                  .append("<p>Occupation Address:</p>")
                  .append('<div style="position:absolute;margin-left:140px;margin-top:-35px;text-align:left;"><div type="text" id = "'+divGeocoder+'"><button style="cursor: pointer;text-align:left;position:absolute;margin-left:230px;margin-top:-25px;border-style:solid;border-size:1px;" id = "'+divMapButton+'">Or&nbspchoose&nbspon&nbspmap</button></div></div>')
                  .append('<button style="position:absolute;margin-left:140px;margin-top:-35px;display:none; cursor: pointer;border-style:solid;border-size:1px;" id = "'+divMapButtonDisable+'">Or input the address</button>')
                  .append('<label for="'+divTravelMethod+'">Ideal Travel Method:&nbsp</label>')
                  .append('<select style="width:150px" autocomplete="off" id="'+divTravelMethod+'"></select>');
              $('#'+divTravelMethod).append('<option value="any" selected>Any</option>')
                  .append('<option value="transit">Public Transit</option>')
                  .append('<option value="auto">Car</option>')
                  .append('<option value="walk">Walk</option>');
              var geocoder =  new Geocoder({
                arcgisGeocoder: {
                  placeholder: "Find a place"
                },
                autoComplete: true,
                map: map
              }, dom.byId(divGeocoder));  
              geocoder.on("select", showLocation);
              $('#'+divMapButton).unbind('click').bind('click', function (e){
                activeWorkerOrStudent =Number(this.id.split('worker')[0]);
                console.log(activeWorkerOrStudent);
                var activeDivGeocoder = activeWorkerOrStudent+'_'+restartTime+'workerAddressGeocoder';
                var activeDivMapButtonDisable = activeWorkerOrStudent+'workerAddressMapDisable';
                $('#'+activeDivGeocoder).hide();
                $('#'+activeDivMapButtonDisable).show();

                connections.push(dojo.connect(travelZoneLayer,'onClick',clickHandler));
                function clickHandler(evt){
                    map.graphics.clear();
                    personList[activeWorkerOrStudent].address= [evt.graphic.attributes[travelZoneAttributeID],evt.mapPoint];
                    var symbol = new SimpleMarkerSymbol().setStyle(
                      SimpleMarkerSymbol.STYLE_SQUARE).setColor(
                      new Color([255,0,0,0.5])
                    );
                    var graphic = new Graphic(evt.mapPoint, symbol);                        
                    map.graphics.add(graphic); 

                }

              });

              $("#"+divMapButtonDisable).unbind('click').bind('click', function (e){
                activeWorkerOrStudent =Number(this.id.split('worker')[0]);
                var activeDivGeocoder =  activeWorkerOrStudent+'_'+restartTime+'workerAddressGeocoder';
                var activeDivMapButtonDisable = activeWorkerOrStudent+'workerAddressMapDisable';
                $('#'+activeDivGeocoder).show();
                $('#'+activeDivMapButtonDisable).hide();
              });
          }
       }
    }
    $('#submitWorkpalce').unbind('click').bind('click', function (e){
      submitTime+=1;
      dojo.forEach(connections,dojo.disconnect);
      map.graphics.clear();
      for(var i =0;i<personList.length;i++){
        var divTransitMethod = i+'workerTravelMethod';
        personList[i].travelMethod = $('#'+divTransitMethod).val();
        if(personList[i].address || personList[i].address!==null){
          var infoTemplate = new InfoTemplate();
          infoTemplate.setTitle('Occupation Address');
          infoTemplate.setContent('<p>'+numberList[i]+' person address.');
          
          var symbolCircle = new SimpleMarkerSymbol().setStyle(
            SimpleMarkerSymbol.STYLE_CIRCLE).setColor(
            new Color([255,0,0,0.5])
          );
          var graphic = new Graphic(personList[i].address[1], symbolCircle);
          graphic.setInfoTemplate(infoTemplate);                                          
          map.graphics.add(graphic); 
        }
      }
      analyzeTheBestHome();
      $('#placeColumn').hide();
      $('#resultColumn').show();
    });
    function analyzeTheBestHome(){
      var allZones = Object.keys(csvData.auto.dataMatrix);
      var timeResult={};
      for(var i=0;i<allZones.length;i++){
        timeResult[allZones[i]]=0;
        var hasValidPerson = false;
        for(var j=0;j<personList.length;j++){
          if(personList[j].address || personList[j].address!==null){
              //if any travel method, find the shortest one.
              hasValidPerson = true;
              if(personList[j].travelMethod === 'any'){
                  var  minimumTime= Infinity;
                  var bestMethod = null;

                  var dataArray =  csvData.transit.dataMatrix[allZones[i]];
                  if(dataArray){
                    if(dataArray[personList[j].address[0]]<minimumTime){
                      bestMethod = 'transit';
                      minimumTime = dataArray[personList[j].address[0]];
                    }
                  }
                  dataArray =  csvData.auto.dataMatrix[allZones[i]];
                  if(dataArray){
                    if(dataArray[personList[j].address[0]]<minimumTime){
                      bestMethod = 'auto';
                      minimumTime = dataArray[personList[j].address[0]];
                    }
                  }
                  dataArray =  csvData.walk.dataMatrix[allZones[i]];
                  if(dataArray){
                    if(dataArray[personList[j].address[0]]<minimumTime){
                      bestMethod = 'walk';
                      minimumTime = dataArray[personList[j].address[0]];
                    }
                  }
                  timeResult[allZones[i]]+=minimumTime;
              }
              else{
                var dataArray = csvData[personList[j].travelMethod].dataMatrix[allZones[i]];
                if(dataArray){
                  timeResult[allZones[i]]+=dataArray[personList[j].address[0]];
                }
                else{
                  timeResult[allZones[i]]+=Infinity;
                }
                
              }      
          }
        }  
      }
      //sort time timeResult based on its value
      //only the key will be preserved
      timeResult = keySortObject(timeResult);
      if(hasValidPerson){
         brushLayer(timeResult);
      }
      else{
          brushLayerWithSingleColor();
      }
      showResult();
    }
    function brushLayer(timeResult){
        var symbol = new SimpleFillSymbol();
        var renderer = new ClassBreaksRenderer(symbol, function(feature){
          return timeResult.indexOf(feature.attributes[travelZoneAttributeID].toString());

        });
      //legend. If you want to change legend scale or legend color, this part of code needs to be modified
      renderer.addBreak(0, 10, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([5, 80, 15,0.90])));
      renderer.addBreak(10, 50, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([37, 121, 24,0.90])));
      renderer.addBreak(50, 150, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([66, 159, 36,0.90])));
      renderer.addBreak(150,250, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([109, 171, 55,0.90])));
      renderer.addBreak(250,350, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([149, 183, 77,0.90])));
      renderer.addBreak(350,450, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([185, 195, 101,0.90])));
      renderer.addBreak(450,550, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([207, 197, 127,0.90])));
      renderer.addBreak(550,750, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([225, 200, 170,0.90])));
      renderer.addBreak(750,1000, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([243, 224, 219,0.90])));
      renderer.addBreak(1000, Infinity, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.90])));
      travelZoneLayer.setRenderer(renderer);
      travelZoneLayer.redraw();    
      var infoTemplate = new InfoTemplate();
      travelZoneLayer.setInfoTemplate(infoTemplate);
    }
    //brush the map with single color for initialization purpose and restarting purpose
    function brushLayerWithSingleColor(){
        var symbol = new SimpleFillSymbol();
        var renderer = new ClassBreaksRenderer(symbol, function(feature){
            return 1
        });
        //legend. If you want to change legend scale or legend color, this part of code needs to be modified
        renderer.addBreak(0, 2, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.60])));
        travelZoneLayer.setRenderer(renderer);
        travelZoneLayer.redraw();
        var infoTemplate = new InfoTemplate();
        travelZoneLayer.setInfoTemplate(infoTemplate);
    }

    function showResult(){
      connections.push(dojo.connect(travelZoneLayer,'onClick', selectZoneHandler));
      function selectZoneHandler(evt){
        $('#morningTravelTime').empty();
        var clickedZone = evt.graphic.attributes[travelZoneAttributeID];
        for(var i=0;i<personList.length;i++){
          if(personList[i].address===null){
            continue;
          }
          var personZone = personList[i].address[0];
          var personMethod = personList[i].travelMethod;
          if( personMethod==='any'){
            var bestMethod;
            var shortestTime=Infinity;
            for(var j in csvData){
                if(j!='distance' && csvData[j].dataMatrix[clickedZone][personZone]<shortestTime){
                  shortestTime = csvData[j].dataMatrix[clickedZone][personZone];
                  bestMethod = csvData[j].type;
                }
            }
            personList[i].travelResult = [bestMethod,shortestTime,csvData.distance.dataMatrix[clickedZone][personZone]];
          }
          else{
            personList[i].travelResult  = [personMethod,csvData[personMethod].dataMatrix[clickedZone][personZone],csvData.distance.dataMatrix[clickedZone][personZone]];
          }
        }
        for(var p=0;p<personList.length;p++){
          if(personList[p].travelResult===null){
            continue;
          }
          //show result on result panel
          $('#morningTravelTime').append('<h4 style="text-align:left; margin-left:25px">'+numberList[p]+' person: </h4>')
              .append('<p style="text-align:left; margin-left:20%">Travel Method: '+personList[p].travelResult[0]+'</p>')
              .append('<p style="text-align:left; margin-left:20%">Morning Travel Time: '+personList[p].travelResult[1].toFixed(2)+' mins</p>')
              .append('<p style="text-align:left; margin-left:20%">Morning Travel Distance: '+personList[p].travelResult[2].toFixed(2)+' km</p>');
        }  
      }
    }
    //restart the whole the application
    //so we need to reinitialize everything
    $('#submitRestart').unbind('click').bind('click', function (e){
      map.graphics.clear();
      restartTime+=1;
      $('#resultColumn').hide();
      $('#householdColumn').show();
      $('#personInfo').empty();
      $('#workplace').empty();
      $('#morningTravelTime').empty();
      personList = null;

      //clean household panel values
      $('#peopleNumber').val('');
      $('#studentNumber').val('');
      $('#workerNumber').val('');
      $('#max-price').val('');
      $('#min-price').val('');
      brushLayerWithSingleColor();
      //remove all 'onclick' event on layers or symbols
      dojo.forEach(connections,dojo.disconnect);
      travelZoneLayer.setInfoTemplate(false)
    });
    
});

//sort an object by value
function keySortObject(object){
  return Object.keys(object).sort(function(a,b){return object[a]-object[b]});
}
//convert csv array into good format(zone-to-zone).
function buildMatrixLookup(arr) {    
  var lookup = {};
  var index = arr.columns;
  var verbal = index[0];
  for(var i =0; i<arr.length;i++){
    var k = arr[i][verbal];
    delete arr[i][verbal];
    lookup[parseInt(k)] = Object.keys(arr[i]).reduce((obj, key) => (obj[parseInt(key)] = Number(arr[i][key]),obj), {});
  }
  return lookup;
}
//check whether it is a number
function checkNumber(n){
  if(isNaN(n)){
    return false;
  }
  else if(!Number.isInteger(n)){
    return false;
  }
  else if(Number(n)<0){
    return false;
  }
  return true;
}
//this variable's onchange function will be called when the variable's value is changed
function Variable(initVal, onChange)
{
    this.val = initVal;          //Value to be stored in this object
    this.onChange = onChange;    //OnChange handler
    //This method returns stored value
    this.GetValue = function(){
        return this.val;};
    //This method changes the value and calls the given handler
    this.SetValue = function(value){
        this.val = value;
        if(value === 3){
            this.onChange();
        }
    };
}
