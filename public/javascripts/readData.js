var i = 0;
importScripts('https://d3js.org/d3.v4.min.js');
var csvData = {
  distance:{
    directory:"../data/Distance_mf2.csv",
    dataMatrix:null
    
  },
  auto:{
    directory:"../data/SOV_AUTO_Time_AM_Cr_mf1.csv",
    dataMatrix:null  
  },
  transit:{
    directory:"../data/Transit_Total_Time_AM.csv",
    dataMatrix:null
    
  },
  walk:{
    directory:"../data/Walk_Time_AM_Cr_mf486.csv",
    dataMatrix:null
    
  }
};
function loadData() {
    var q = d3.queue();

    q.defer(d3.csv,csvData.distance.directory)
      .defer(d3.csv,csvData.auto.directory)
        .defer(d3.csv,csvData.transit.directory)
          .defer(d3.csv,csvData.walk.directory)
          .await(finishReading);
}
function finishReading(error,distance,auto,transit,walk){
  
  csvData.distance.dataMatrix=buildMatrixLookup(distance);
  
  csvData.auto.dataMatrix=buildMatrixLookup(auto);
  csvData.transit.dataMatrix=buildMatrixLookup(transit);
  csvData.walk.dataMatrix=buildMatrixLookup(walk);
  

  postMessage(JSON.stringify(csvData));
  
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
function stringToUintArray(message) {
  var encoded = self.btoa(message);
  var uintArray = Array.prototype.slice.call(encoded).map(ch => ch.charCodeAt(0));
  var uarray = new Uint8Array(uintArray);
  return uarray;
}
loadData();
