var submitTime = 0;
var map;
var personList;
var restartTime=0;
var numberList = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth'];
var householdInfo = {
  totalMembers:null,
  numOfWorkers:null,
  numOfStudents:null,
  houseType:"Any",//Single house, Duplex, Condon,Appartment
  housePriceRange:{
      min:0,
      max:Infinity
  }
};
var connections = [];
var csvData = {
  // distance:{
  //   directory:"../data/Distance_mf2.csv",
  //   dataMatrix:null,
  //   type:'distance'
  // },
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
  }
};
 
  var monitorDataStatus = new Variable(0,function(){
    $('#wait').hide();
  });
  var w;
  if(window.Worker){
    $('#wait').show();
    //  w = new Worker("./javascripts/readData.js");
    //  w.onmessage = function(e){
    //    csvData = JSON.parse(e.data);
    //    $('#wait').hide();
    //   if(submitTime!==0){
    //     $('#submitWorkpalce').click();
    //   }
    //   w.terminate();
    // };
    
    w1 = new Worker("./javascripts/readAuto.js");
    w1.onmessage = function(e){
      csvData.auto.dataMatrix = JSON.parse(e.data);
      w1.terminate();
      monitorDataStatus.SetValue(monitorDataStatus.GetValue()+1);
   };
   w2 = new Worker("./javascripts/readTransit.js");
   w2.onmessage = function(e){
     csvData.transit.dataMatrix = JSON.parse(e.data);
     w2.terminate();
     monitorDataStatus.SetValue(monitorDataStatus.GetValue()+1);

  };
  w3 = new Worker("./javascripts/readWalk.js");
  w3.onmessage = function(e){
    csvData.walk.dataMatrix= JSON.parse(e.data);
    w3.terminate();
    monitorDataStatus.SetValue(monitorDataStatus.GetValue()+1);
  };

}
else{
  //bad browser which doesn't support a seperate worker/thread
  $("#wait").show();
  var q = d3.queue();
  q.defer(d3.csv,csvData.auto.directory)
      .defer(d3.csv,csvData.transit.directory)
        .defer(d3.csv,csvData.walk.directory)
        .await(finishReadingWithoutWorker);
}


function finishReadingWithoutWorker(error,auto,transit,walk){
  csvData.auto.dataMatrix=buildMatrixLookup(auto);
  csvData.transit.dataMatrix=buildMatrixLookup(transit);
  csvData.walk.dataMatrix=buildMatrixLookup(walk);
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
    
    var travelZoneLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=8gOmRemAl8guD3WA_rfLwe50SgsEvaZzIcXIraH9xC3NQPCLraLwcHIkz3osWU-SHUdSKO1N6rCnWDF_CzWLFlFFUCeugETS44f409SsCtX9eC-HoX0dkXZj2vQD1SsboTGNgAzLDtG-BfIv0FnlWBNqq84hC5a6e7lj2Tt1oV8V0WxGiCE7rtaXgxZr18TZur-l_T6gWW2jDh1mt5q0mqty8vc133DvOtg5JhtGm8OTdn9rYtscRKu66B153RYB",{
        mode: FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],
        // infoTemplate: template
    });
    //LRT layer
    var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0?token=8ulK33e1cubPoKiLq5MxH9EpaN_wuyYRrMTiwsYkGKnPgYFbII8tkvV5i9Dk6tz2jVqY-_Zx-0-GXY3DeSVbtpo0NlLxEjFuPwpccMNBTGZwZsVYNrqBui-6DhEyve8rnD3qGPg_2pun9hFotDWSmlWAQn41B_Sop7pr9KLSS64H_CiMRPW0GZ9Bn6gPWkR8d0CZQ6fUoctmBUJp4gvRdf6vroPETCE9zJ2OFUdPto1Xm2pxvDc7Y5mDPT_ZOXbi",{
        mode: FeatureLayer.MODE_SNAPSHOT,
        outFields: ["*"],
    });
    
    map.on('load',function(){
        map.addLayer(travelZoneLayer);
        map.addLayer(lrtFeatureLayer);
    });
    
    function showLocation(evt) {
      activeWorkerOrStudent = Number(evt.target.id.split('worker')[0]);
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
          personList[activeWorkerOrStudent].address = [travelZoneLayer._graphicsVal[c].attributes.TAZ_New,point];
          found = true;
          break;
        }
      }

    }

     
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
          $('#peopleNumber').css('border-color','green');
        }
        if(!checkNumber(householdInfo.numOfWorkers)){
          check=false;
          alert('Please enter a non-negative integer!');
          $('#workerNumber').css('border-color','red');

        }
        else{
          $('#workerNumber').css('border-color','green');
        }
        if(!checkNumber(householdInfo.numOfStudents)){
          check=false;
          alert('Please enter a non-negative integer!');
          $('#studentNumber').css('border-color','red');
        }
        else{
          $('#studentNumber').css('border-color','green');
        } 
        if(check){
          $("#householdColumn").hide();
          $('#personColumn').show();
          fillPersonalInfoPanel();
        }   
    });
    function fillPersonalInfoPanel(){
        for(var i=0;i<householdInfo.totalMembers;i++){
          var divId = i+'personInfo';
          // var divNameId = i+'personName';
          var divAgeId = i+'personAge';
          var divAgeValue = i+'personAgeValue';
          var divOccupId = i+'personOccup';
    
          $('#personInfo').append('<div style="text-align:right; margin-right:40%" id="'+divId+'" ></div>');
          $('#'+divId).append('<h4 style="text-align:left; margin-left:20px">'+numberList[i]+' person:<h4>');
          // $('#'+divId).append('<label for="'+divNameId+'">Name:</label>');
          // $('#'+divId).append('<input style="width:150px" type="text" id="'+divNameId+'">');
          $('#'+divId).append('<label for="'+divAgeId+'">Age:</label>');
          $('#'+divId).append('<input type="range" min="1" max="120" value="50" class="slider" style="width:150px" type="text" id="'+divAgeId+'"><p style="margin-top:-20px; margin-left:290px;"><span id="'+divAgeValue+'"></span></p>');
          $('#'+divId).append('<br><label for="'+divOccupId+'">Occupation:</label>');
          $('#'+divId).append('<select style="width:150px" autocomplete="off" id="'+divOccupId+'"></select>');
          $('#'+divOccupId).append('<option value="other" selected>Other</option>');
          $('#'+divOccupId).append('<option value="employee">Employee at Edmonton</option>');
          $('#'+divOccupId).append('<option value="student">Student at Edmonton</option><br>');
          
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
          console.log('clickPersonalSubmit')

          for(var i=0;i<householdInfo.totalMembers;i++){
            // var divNameId = i+'personName';
            var divAgeId = i+'personAge';
            var divOccupId = i+'personOccup';
            // personList[i].name = ($('#'+divNameId).val());
            personList[i].age = ($('#'+divAgeId).val());
            console.log(personList[i].age);
            personList[i].occupation =($('#'+divOccupId).val());
          }
          $('#personColumn').hide();
          $('#placeColumn').show();
          fillPlacePanel();
        });
    }
    function fillPlacePanel(){
  

       for(var i=0;i<personList.length;i++){
          if(personList[i].occupation!=='other'){
              var divId = i+'workInfo';
              var divGeocoder = i+'_'+restartTime+'workerAddressGeocoder';
              console.log(divGeocoder)

              var divMapButton = i+'workerAddressMap';
              var divMapButtonDisable = i+'workerAddressMapDisable';
              var divTravelMethod = i+'workerTravelMethod';
              console.log($('#workplace'))
              $('#workplace').append('<div style="text-align:left; margin-left:20px;" id="'+divId+'" ></div>');
              $('#'+divId).append("<h4 style='text-align:left'>"+numberList[i]+" person:<h4>");
              $('#'+divId).append("<p>Occupation Address:</p>");
              $('#'+divId).append('<div style="position:absolute;margin-left:140px;margin-top:-35px;text-align:left;"><div type="text" id = "'+divGeocoder+'"><button style="cursor: pointer;text-align:left;position:absolute;margin-left:230px;margin-top:-25px;border-style:solid;border-size:1px;" id = "'+divMapButton+'">Or&nbspchoose&nbspon&nbspmap</button></div></div>');
              $('#'+divId).append('<button style="position:absolute;margin-left:140px;margin-top:-35px;display:none; cursor: pointer;border-style:solid;border-size:1px;" id = "'+divMapButtonDisable+'">Or input the address</button>');
              $('#'+divId).append('<label for="'+divTravelMethod+'">Ideal Travel Method:&nbsp</label>');
              $('#'+divId).append('<select style="width:150px" autocomplete="off" id="'+divTravelMethod+'"></select>');
              $('#'+divTravelMethod).append('<option value="any" selected>Any</option>');
              $('#'+divTravelMethod).append('<option value="transit">Public Transit</option>');
              $('#'+divTravelMethod).append('<option value="auto">Car</option>');
              $('#'+divTravelMethod).append('<option value="walk">Walk</option>');
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
                var activeDivGeocoder = activeWorkerOrStudent+'_'+restartTime+'workerAddressGeocoder';
                var activeDivMapButtonDisable = activeWorkerOrStudent+'workerAddressMapDisable';
                $('#'+activeDivGeocoder).hide();
                $('#'+activeDivMapButtonDisable).show();

                connections.push(dojo.connect(travelZoneLayer,'onClick',clickHandler))
                function clickHandler(evt){
                    map.graphics.clear();
                    personList[activeWorkerOrStudent].address= [evt.graphic.attributes.TAZ_New,evt.mapPoint];
                    var symbol = new SimpleMarkerSymbol().setStyle(
                      SimpleMarkerSymbol.STYLE_SQUARE).setColor(
                      new Color([255,0,0,0.5])
                    );
                    var graphic = new Graphic(evt.mapPoint, symbol);                        
                    map.graphics.add(graphic); 
                    // if(typeof(evt.graphic.attributes.TAZ_New)!=='undefined'){
                    //   console.log($('#checkTrue_'+activeWorkerOrStudent))
                    //   $('#checkTrue_'+activeWorkerOrStudent).css('visibility','visible')
                    // }
                }

              })

              $("#"+divMapButtonDisable).unbind('click').bind('click', function (e){
                activeWorkerOrStudent =Number(this.id.split('worker')[0]);
                var activeDivGeocoder =  activeWorkerOrStudent+'_'+restartTime+'workerAddressGeocoder'+restartTime;
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
      //console.log(allZones);
      var timeResult={};
      for(var i=0;i<allZones.length;i++){
        timeResult[allZones[i]]=0;
        for(var j=0;j<personList.length;j++){
          if(personList[j].address || personList[j].address!==null){
              //if any travel method, find the shortest one.
              if(personList[j].travelMethod === 'any'){
                  var  minimumTime= Infinity;
                  var bestMethod = null;
                  var byTransitAutoWalkArray =  [csvData.transit.dataMatrix[allZones[i]], csvData.auto.dataMatrix[allZones[i]], csvData.walk.dataMatrix[allZones[i]]];
              
                  //var byTransitAutoWalk = [csvData.transit.dataMatrix[allZones[i]][personList[j].address[0]]||Infinity, csvData.auto.dataMatrix[allZones[i]][personList[j].address[0]]||Infinity, csvData.walk.dataMatrix[allZones[i]][personList[j].address[0]]||Infinity];
                  //if transit
                  var dataArray =  csvData.transit.dataMatrix[allZones[i]];
                  if(dataArray){
                    if(dataArray[personList[j].address[0]]<minimumTime){
                      bestMethod = 'transit'
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
      timeResult = keySortObject(timeResult);
      brushLayer(timeResult);
      showResult();
      

    }
    function brushLayer(timeResult){
      var renderer = new ClassBreaksRenderer(symbol, function(feature){
                    // console.log(feature.attributes.TAZ_New)
          return timeResult.indexOf(feature.attributes.TAZ_New.toString());  

      });
      var symbol = new SimpleFillSymbol(); 

      //legend. If you want to change legend scale or legend color, this part of code needs to be modified
      renderer.addBreak(0, 10, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.90])));
      // renderer.addBreak(10, 50, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	249, 238, 237,0.90])));
      renderer.addBreak(10, 50, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([243, 224, 219,0.90])));
      // renderer.addBreak(100, sort[4*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([237, 214, 202,0.90])));
      renderer.addBreak(50, 150, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([225, 200, 170,0.90])));
      // renderer.addBreak( sort[5*chunkZones],  sort[6*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([213, 196, 141,0.90])));
      renderer.addBreak(150,250, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([207, 197, 127,0.90])));
      // renderer.addBreak(150,250, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([201, 199, 113,0.90])));
      renderer.addBreak(250,350, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([185, 195, 101,0.90])));
      // renderer.addBreak(sort[9*chunkZones], sort[10*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([168, 189, 88,0.90])));
      renderer.addBreak(350,450, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([149, 183, 77,0.90])));
      // renderer.addBreak(sort[11*chunkZones], sort[12*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([129, 177, 66,0.90])));
      renderer.addBreak(450,550, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([109, 171, 55,0.90])));
      // renderer.addBreak(sort[13*chunkZones], sort[14*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([87, 165, 45,0.90])));
      renderer.addBreak(550,750, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	66, 159, 36,0.90])));
      // renderer.addBreak(sort[15*chunkZones], sort[16*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([44, 153, 27,0.90])));  
      renderer.addBreak(750,1000, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	37, 121, 24,0.90])));
      // renderer.addBreak(sort[17*chunkZones], sort[18*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([11, 106, 18,0.90])));
      renderer.addBreak(1000, Infinity, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([5, 80, 15,0.90])));
      travelZoneLayer.setRenderer(renderer);
      travelZoneLayer.redraw();    
      var infoTemplate = new InfoTemplate();
      // infoTemplate.setTitle('Travel Time Result');
      // // infoTemplate.setContent('<p>'+numberList[i]+' person address.')
      // 
      // var infoTemplate = generateInfoTemplate();
      
      travelZoneLayer.setInfoTemplate(infoTemplate);
    }
    function showResult(){
      connections.push(dojo.connect(travelZoneLayer,'onClick', selectZoneHandler));
      function selectZoneHandler(evt){
        $('#morningTravelTime').empty();
        var clickedZone = evt.graphic.attributes.TAZ_New;
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
                if(csvData[j].dataMatrix[clickedZone][personZone]<shortestTime){
                  shortestTime = csvData[j].dataMatrix[clickedZone][personZone];
                  bestMethod = csvData[j].type;
                }
            }
            personList[i].travelResult = [bestMethod,shortestTime];
          }
          else{
            
            personList[i].travelResult  = [personMethod,csvData[personMethod].dataMatrix[clickedZone][personZone]];
          }
        }
        
        for(var p=0;p<personList.length;p++){

          if(personList[p].travelResult===null){
            continue;
          }
          $('#morningTravelTime').append('<h4 style="text-align:left; margin-left:25px">'+numberList[p]+' person: </h4>')
          $('#morningTravelTime').append('<p style="text-align:left; margin-left:20%">Travel Method: '+personList[p].travelResult[0]+'</p>');
          $('#morningTravelTime').append('<p style="text-align:left; margin-left:20%">Daily Travel Time: '+2*personList[p].travelResult[1].toFixed(2)+' mins</p>');

          
        }  
      }
    }
    $('#submitRestart').unbind('click').bind('click', function (e){
      restartTime=1+restartTime;
      $('#resultColumn').hide();
      $('#householdColumn').show();
      $('#personInfo').empty();
      $('#workplace').empty();
      $('morningTravelTime').empty();
      personList = null;
      dojo.forEach(connections,dojo.disconnect);
      travelZoneLayer.setInfoTemplate(false)
      
      
    });
    
});

// }
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
