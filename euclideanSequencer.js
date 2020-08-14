inlets = 1;
outlets = 4;

var n = 16; //number of steps
var k = 0; //number of pulses
var m = 0; //number of 'off's'

var seqContainer = new Array(); //array that contains all (up to 4) sequences

//array of boolean values in which true === forward and false === reverse
var seqDirections = [true, true, true, true];

//array of current step for each of the 4 rings
var stepArray = [0, 0, 0, 0];

//global settings for the GUI
var outerRadius = .9;
var innerRadius = .8;
var vbrgb = [0.53, .53, .54, 1.]

var seqColors = new Array();
seqColors[0] = [0.757, 0.078, 0.078];//red
seqColors[1] = [0.992157, 0.890196, 0.047059];//yellow
seqColors[2] = [0.141176, 0.85098, 0.054902];//green
seqColors[3] = [0.109804, 0.592157, 0.929412];//blue

//true (default) means that all rings are sync'd; false means that rings can move independently from one another
var syncOn = true;

//false means that the sequence hasn't run yet
//this is necessary for step handling so that '0' plays on the first run
var hasPlayed = [false, false, false, false]

//whether or not a sequence is active, according to the square radio button in the GUI
//if not active, the sequence is rendered with transparency
var isActive = [false, false, false, false];

//default transparency setting for inactive sequences
var transparency = 0.35;

//keep track of previous 'n' value for the compareNVals function
var nArray = [[0, 0], [0, 0], [0, 0], [0, 0]];

function seqStatus(id, status) {
  if (status === 1) {
	isActive[id] = true;
  } else {
	isActive[id] = false;
	displayAll();
  }
}

function makeSeq(id, n, k) {
  if (n < k) {
    n = k;
  }
  var arr = nArray[id];
  arr.pop();
  arr.unshift(n);
  nArray[id] = arr;
  compareNVals(id);
  euclid(id, n, k); 
}

function euclid(id, n, k) {
  var m = n-k;
  var nOrig = n;
  var kOrig = k;
  var sequence = new Array();
  var numChanges;
  var lsl = 1; //left sequence length
  var rsl = 1; //right sequence length

  //initialize the seque with 1's and 0's for k & m, respectively
  for (var i = 0; i<k; i++) {
	sequence.push(1);
  }
  for (var i = 0; i<m; i++) {
	sequence.push(0);
  }
  
  if (k > 0) {
    while (m > 1) {
	  numChanges = (m > k) ? k: m;
	  for (var i = 0; i<numChanges; i++) {
		for (var j = 0; j<rsl; j++) {
		  //int of index where that we are grabbing to splice in
		  var get = (k*lsl) + (i*rsl) + j;
		  var valObj = sequence.splice(get, 1);
		  var val = valObj[0];
		  //int of index where 'get' will be spliced
		  var add = lsl + ((lsl+rsl) * i) + j;
		  var del = get+1
		  sequence.splice(add, 0, val);
		}
	  }
	  lsl += rsl;
	  k = numChanges;
	  n = n-k;
	  m = n-k;
	  //update rsl value once lsl starts increasing
	  if (lsl > 1) {
		if (m!=(nOrig-(lsl*k))) {
		  rsl = (nOrig-(lsl*k))/m;
		}
	  }
	}		
  }
  seqContainer[id] = sequence;
  
  displayAll();
  //this extra outlet let's max find the appropriate step in the live.step sequencer
  outlet(3, sequence, stepArray[id], id);
}

function display(sequence, id) {
	//the display consists of two rings for each sequence:
	//an outer ring that serves to visualize the sequence of 1's and 0's
	//an inner ring (of color brgb) that serves as empty space to separate the other sequences/rings
	
	//set radius sizes for each concentric ring
	var outerRad = outerRadius - (id)*.15;//this is the 'outer' ring that represents the sequence
	var innerRad = outerRad - .1;//this is the 'inner' ring that represents the empty space between each ring
	
	var thisTransparency;
	if (isActive[id] == false) {
	  sketch.glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
	  thisTransparency = transparency;
	} else {
	  thisTransparency = 1.;
	}

	if (sequence) {
	  var a = sequence.length;
	}
	var degreesPerSlice = 360/a;//degrees per slice

	with (sketch) {
	
	  //loop through array and assign black slices to '1' values and white slices to '0' values
	  for (var i = 0; i<a; i++) {
		var angle = degreesPerSlice*(i+1)
		if (sequence[i] === 0) {
			glcolor(1, 1, 1)
			moveto(0, 0);
			circle(outerRad, 90-(degreesPerSlice*i), 90-(degreesPerSlice*i)-degreesPerSlice);
			
		} else {
			glcolor(0, 0, 0)
			moveto(0, 0);
			circle(outerRad, 90-(degreesPerSlice*i), 90-(degreesPerSlice*i)-degreesPerSlice);		
		}
	  }
	
	  //color in current step
	  var step = stepArray[id]
	  var colArray = seqColors[id];
	
	  //set 'off' steps to be more transparent
	  /*
	  if (sequence[step] === 0) {
		glcolor(colArray[0], colArray[1], colArray[2], .1);
	  } else {
		glcolor(colArray[0], colArray[1], colArray[2], 1.);
	  }*/
	  glcolor(colArray[0], colArray[1], colArray[2]);
	
	  circle(outerRad, 90-(step*degreesPerSlice), 90-(step*degreesPerSlice)-degreesPerSlice);
	
	  //draw lines (of color brgb) that separate each 'slice' of the sequence
      for (var i = 0; i<a; i++) {
		moveto(0, 0);
		glcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		
		var angle = (degreesPerSlice)*(i+1);
	    var angleRadians = angle*Math.PI/180;
		var x1 = Math.cos(angleRadians+Math.PI/2)*outerRad;
  		var y1 = Math.sin(angleRadians+Math.PI/2)*outerRad;
		gllinewidth(2)
		line(x1, y1);	
	  }
	
	//draw the 'inner' circle that creates empty space between sequences
	moveto(0, 0);
	glcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3])
	circle(innerRad)
	glcolor(0, 0, 0)
    }
	    
  refresh()
	
}

function clear() {
  seqContainer = new Array();
  stepArray = [0, 0, 0, 0];
  var seqDirections = [true, true, true, true];
  
  with (sketch) {
    glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
    glclear();
  }
  refresh();
}

function bang() {
	
	//we are going to display n slices corresponding to the correct color, for n = number of rings
	for (var i = 0; i<seqContainer.length; i++) {
	  if (isActive[i] === true) {
	    var step = stepArray[i];
	  
	    if (seqContainer[i]) {
		  //if the sequence hasn't played yet, it needs to play '0' before beginning;
	  	  if ((hasPlayed[i] === false) && (step === 0)) {
		    outlet(2, i);
		    outlet(1, step);
            outlet(0, seqContainer[i]);

		    display(seqContainer[i], i);
	
		    hasPlayed[i] = true;
		  } else {
	        var bangStep = takeStep(i);
		    display(seqContainer[i], i);
		
		    outlet(2, i);
		    outlet(1, bangStep);
    	    outlet(0, seqContainer[i]);
          }	
        } else {
	      post('no array');
	    }
	  }	
  }
}

//change base (background + inner ring) color
function brgb(r, g, b) {
	vbrgb[0] = r;
	vbrgb[1] = g;
	vbrgb[2] = b;
	displayAll();	
}

function displayAll() {
  with (sketch) {
    sketch.glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
    sketch.glclear();
  }
  for (var i = 0; i<seqContainer.length; i++) {
    if (seqContainer[i]) {
      display(seqContainer[i], i);
    }
  }
}

function resetSeq(id) {
	
	if (typeof(id) === 'number') {
	  hasPlayed[id] = false;
	  stepArray[id] = 0;
	} else if (id === 'all') {
	  for (var i = 0; i<stepArray.length; i++) {
		hasPlayed[i] = false;
	    stepArray[i] = 0;
	  }
	}
	
	displayAll();
}

function removeSeq(id) {
	
	seqContainer[id] = null;
	with (sketch) {
		glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
		glclear();
	}
	refresh();
	displayAll();
}

function reverseSeq(id, direction) {
	//1 === reverse, 0 === forward
	if ((seqDirections[id] === true) && (direction === 1)) {
	  seqDirections[id] = false;
	} else if ((seqDirections[id] === false) && (direction === 0)) {
	  seqDirections[id] = true;
	}  
}

function rotateSeq(id, y, z) {
	
	var dir = y;
	var rotSpaces = z;
	var seq = new Array();
	seq = seqContainer[id];

	if ((dir === 1) && (rotSpaces > 0)) {
	  for (var i = 0; i < rotSpaces; i++) {
		var temp = seq.pop();
		seq.unshift(temp);
	  }
	} else if ((dir === 0) && (rotSpaces > 0)) {
	  for (var i = 0; i < rotSpaces; i++) {
		var temp = seq.shift();
		seq.push(temp);
	  }
	}
	
	seqContainer[id] = seq;
    displayAll();
    //this extra outlet let's max find the appropriate step in the live.step sequencer
    outlet(3, seq, stepArray[id], id);
}

function tick(id) {
  //we are going to display n slices corresponding to the correct color, for n = number of rings
  var step = stepArray[id];
  if (isActive[id] === true) {  
  	if (seqContainer[id]) {
	  //if the sequence hasn't played yet, it needs to play '0' before beginning;
	  if ((hasPlayed[id] === false) && (step === 0)) {
	    outlet(2, id);
	    outlet(1, step);
        outlet(0, seqContainer[id]);

	    displayAll();
	
	    hasPlayed[id] = true;
	  } else {
		
	    var tickStep = takeStep(id);
	    
	    displayAll();
		
	    outlet(2, id);
	    outlet(1, tickStep);
        outlet(0, seqContainer[id]);
      }	
    }
}}

function displayAll() {
	
  with (sketch) {
	glclearcolor(vbrgb[0],vbrgb[1],vbrgb[2],vbrgb[3]);
	glclear();
  }
  refresh();
  for (var i = 0; i < seqContainer.length; i++) {
	if (seqContainer[i]) {
	  if (isActive[i] === true) {
	  	display(seqContainer[i], i);
	  }
	}
  }
}

function takeStep(n) {
  if (seqDirections[n] === true) {
    stepArray[n] += 1;
	stepArray[n] %= seqContainer[n].length;
  } else {
    if (stepArray[n] === 0) {
      stepArray[n] = seqContainer[n].length-1;
	} else {
	  stepArray[n] -= 1;
	}			  
  }
  return stepArray[n];
}

//if previous n is less than new n and the step is bigger than the new n, re-start the sequence
function compareNVals(id) {
  if ((nArray[id][0] < nArray[id][1]) && (stepArray[id]>nArray[id][0])) {
	stepArray[id] = 0;
	post(stepArray[id]);
  }
}

