var i = 0;
importScripts('https://d3js.org/d3.v4.min.js');


var auto={
    directory:"../data/SOV_AUTO_Time_AM_Cr_mf1.csv",
    dataMatrix:null,
    type:'auto'
  }

function loadData() {
    var q = d3.queue();
        q.defer(d3.csv,auto.directory)
          .await(finishReading);
}
function finishReading(error,auto){
  postMessage(JSON.stringify(buildMatrixLookup(auto)));
  
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
