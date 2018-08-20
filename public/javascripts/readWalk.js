importScripts('https://d3js.org/d3.v4.min.js');
var walkDirectory="../data/Walk_Time_AM_Cr_mf486.csv";

function loadData() {
    var q = d3.queue();
    q.defer(d3.csv,walkDirectory).await(finishReading);
}
function finishReading(error,walk){
  postMessage(JSON.stringify(buildMatrixLookup(walk)));
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
