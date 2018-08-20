importScripts('https://d3js.org/d3.v4.min.js');
var transitDirectory="../data/Transit_Total_Time_AM.csv";
  

function loadData() {
    var q = d3.queue();
    q.defer(d3.csv,transitDirectory)
          .await(finishReading);
}
function finishReading(error,transit){
  postMessage(JSON.stringify(buildMatrixLookup(transit)));
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
