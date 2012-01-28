var state_ = null;
var participants_ = null;


// Note that if you click the button several times in succession,
// if the state update hasn't gone through, it will submit the same
// delta again.  The hangout data state only remembers the most-recent
// update.
function buttonClicked() {
   console.log("Button clicked");
   console.log(gapi.hangout.data.getState()['count']);
   var value = 0;
   if (gapi.hangout.data.getState()['count']) {
       value = parseInt(gapi.hangout.data.getState()['count']);
   }

   console.log("Value is " + value);
   // Send update to shared space.
   // NOTE:  Only ever send strings as values in the key-value pairs
   gapi.hangout.data.submitDelta({
       'count': '' + (value + 1)
   });
}

// Whenever the shared data is updated, rewrite UI
function stateUpdated(delta, metadata) {
    console.log("state updated");
   if (!gapi.hangout.data.getState()['count']) {
       contentDiv.innerHTML = "The count is 0."
   } else {
       contentDiv.innerHTML = "The count is " + gapi.hangout.data.getState()['count'] + ".";
   }
}

function participantsUpdated() {
    console.log("Entering participants updated");
    var participantsArray = getAll();
    console.log("participants: " + participantsArray);
    participantList = "<ul>";
    for (var i = 0; i < participantsArray.length; i++) {
	var participant = participantsArray[i];
	console.log("iterating through participant: ", participant);
	participantList += "<div class='participants'> <li>";
	participantList += participant;
	participantList += "</li> </div>";
    }
    participantList += "</ul>";
    console.log("participant list HTML" + participantList);
    $("#participantsList").empty();
    $("#participantsList").append(participantList);
}


// Sets up callbacks for state change
// You should not set up the state object until you get your first callback.
function init() {
    console.log("init");
    if (gapi && gapi.hangout) {
	var initHangout = function(apiInitEvent) {
	    
	    if (apiInitEvent.isApiReady) {
		console.log("Adding observers");
		gapi.hangout.data.onStateChanged.add(stateChanged);
		gapi.hangout.data.onStateChanged.add(stateUpdated);
		gapi.hangout.onEnabledParticipantsChanged.add(participantsUpdated);
		
		gapi.hangout.onApiReady.remove(initHangout);
		_state = null;
		_state = gapi.hangout.data.getState();
		
	    }
	};
	
	gapi.hangout.onApiReady.add(initHangout);
    }
}

// Note that the hangouts object is not set up until the gadget loads
gadgets.util.registerOnLoadHandler(init);

// Reset value of "count" to 0
function resetCounter() {
   gapi.hangout.data.submitDelta({
       'count': '0'
   });
}
