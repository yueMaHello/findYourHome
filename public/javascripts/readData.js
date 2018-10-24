//a seperate thread
var i = 0;
importScripts('https://d3js.org/d3.v4.min.js');
//if you changed the csv files' titles, you need to change code in this variable
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
//loadData using D3
function loadData() {
    var q = d3.queue();
    q.defer(d3.csv,csvData.auto.directory)
      .defer(d3.csv,csvData.transit.directory)
        .defer(d3.csv,csvData.walk.directory)
          .defer(d3.csv,csvData.distance.directory)
            .await(finishReading);
}
//convert csv matrices into desired Json format.
function finishReading(error,auto,transit,walk,distance){
  csvData.auto.dataMatrix=buildMatrixLookup(auto);
  csvData.transit.dataMatrix=buildMatrixLookup(transit);
  csvData.walk.dataMatrix=buildMatrixLookup(walk);
  csvData.distance.dataMatrix=buildMatrixLookup(distance);
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

loadData();
