
// Client state
var participantRole = "";
var timeOfDay = "";
var timeout = null;
var isDead = false;
var liveMafia = 0;
var _state = {};
var gameInSession = false;

// global variable keys
var globalURL = "http://ec2-174-129-51-197.compute-1.amazonaws.com/";
var deadListKey = "deadList";
var voteCountKey = "voteCount";
var numberMafiaKey = "numMafia";
var gameIDKey = "gameID";
var votingListKey = "votingList";
var nameToIDMapKey = "nameToID";

// TODO: Take out all junk calls

////////////////////
// Getter methods  
////////////////////

function getNewGameID() {
   return gapi.hangout.getHangoutId();
}

function getGameID() {
    return gapi.hangout.getHangoutId();
}

function getParticipantID() {
    return gapi.hangout.getParticipantId();    
}

function getDeadList() {
    return _state[deadListKey];
}

function getNameToIDMap() {
    if (_state[nameToIDMapKey])
	return JSON.parse(_state[nameToIDMapKey]);
    else return [];
}

function getAll() {
    var displayNameArray = [];
    var part_list = gapi.hangout.getEnabledParticipants();
    for (var i = 0; i < part_list.length; i++) {
	displayNameArray.push(part_list[i].person.displayName);
    }
    return displayNameArray;
}

function getAlive() {
    var participants = getAll();
    var map = getNameToIDMap();
    var deadList = getDeadList();
    var aliveList = [];
    for (name in participants) {
	var id = map[name];
	if (id in deadList) {
	} else {
	    aliveList.push(id);
	}
    }
    return aliveList.length;
}

function getVotingList() {
    if (_state[votingListKey])
	return JSON.Parse(_state[votingListKey]);
    else
	return {};
}

function getAliveList() {
    masterList = getAll();
    Deadlist = getDeadList();
    for(var i = 0; i < myArray.length; i++){             
	if(masterList[i] in deadList){ 
            masterList.splice(i,1);    
	}
    }
    return masterList;
}

/** 
  Requests the role for the current game ID from the server
*/
function askForRole() {
    var gameID = getGameID();
    console.log("asking server for role with game ID: ", gameID);
    var getURL = globalURL + "addPlayer/" + gameID + "/" + getParticipantID();
    $.ajax({
	type: 'GET',
	url: getURL,
	success: function(data) {
	    console.log("Received role:", data);
	    participantRole = data;
	}, 
	error: function(error) {
	    console.log("Defaulting to villager");
	    participantRole = "Villager";
	}});
}

/** 
 Small wrapper function to get the number of mafia in the game, based on the algorithm for how many mafia should be spawned
 @return Returns the number of mafia members in this game.
*/
function getNumberOfMafia() {
    var numParticipants = getAll().length;
    var numMafia = Math.floor(numParticipants / 3);
    return numMafia;
}

/**
 Performs an AJAX request to get the number of live mafia from the server. Modifies the global state.
*/
function getNumberOfLiveMafia() {
    var gameID = getGameID();
    var getURL = globalURL + "numMafia/" + getGameID();
    $.get(getURL, function(data) {
	console.log("Received number of live mafia:", data);
	liveMafia = parseInt(data);
    });
}

/**
 Given a voting list, figures out the participant with the maximum number of votes in order to determine who the next person to die should be
 @param dict The dictionary to iterate through
 @return Returns the participant ID with the highest number of votes
*/
function findDeadPerson(dict) {
    var maxID = "";
    var maxCount = 0;

    for (key in dict) { // TODO: Does this work?
	if (dict[key] > maxCount) {
	    maxID = key;
	    maxCount = dict[key];
	}
    }

    return maxID;
}





////////////////////////////////
// PRE-ROUND STATE CLEANUP
////////////////////////////////


/**
 Changes the time.
 @param newTime a string containing the new time, either "Day" or "Night"
*/
function changeTime(newTime) {
    if (isDead)
	return;
    if (participantRole == "Villager") {
	changeAVStatusForNewTime(newTime);
	if (newTime == "Day")
	    timeout = setTimeout("voteForSelfToDie()", 60000);
    }
    getNumberOfLiveMafia();
    timeOfDay = newTime;
}

/**
 Timeout function. The user votes to kill themselves.
*/
function voteForSelfToDie() {
    voteForUser(getParticipantID());
    stopTimer();
}

/** 
 Stops the timeout function.
*/
function stopTimer() {
    clearTimeout(timeout);
}

/** 
 Kills this client. Sets isDead to true, and if this client is a mafia member, informs the server to decrement the number of mafia.
*/
function die() {
    isDead = true;
    if (participantRole == "Mafia") {
	var gameID = getGameID();
	var putURL = globalURL + "decrement/" + gameID;
	$.get(putURL,
	   function() {
	       console.log("Decremented number of live mafia");
	   });
    }
}

/**
 Checks whether the win conditions have been satisfied. 
 @return Returns "Mafia" if the win conditions have been satisfied for the mafia, "Villagers" if the mafia are all dead, null otherwise.
*/
function checkWin() {
    
    if (liveMafia > (getAll().length - liveMafia))
	return "Mafia";
    else if (liveMafia == 0) 
	return "Villagers";
    else
	return null;
}

/**
  Changes the AV status for the new time.
  @param newTime A string containing the new time, either "Day" or "Night"
*/
function changeAVStatusForNewTime(newTime) {
    console.log("Changing status for participant: ", getParticipantID(), "with new time: ", newTime);
    var villagerEnable;
    if (newTime == "Day")
	villagerEnable = true;
    else
	villagerEnable = false;

    gapi.hangout.av.setMicrophoneMute(!villagerEnable);
    for (participantID in gapi.hangout.getEnabledParticipants()) {
	gapi.hangout.av.setParticipantAudioLevel(participantID, !villagerEnable);
	gapi.hangout.av.setParticipantVisible(participantID, !villagerEnable);
    }
        
}

//////////////////////////
/// IN-ROUND FUNCTIONS
/////////////////////////

/**
 Client-side function that votes for a participant to be killed. Meant for both mafia and villagers.
 @param participantName the participant name to vote for.
*/
function voteForUser(participantName) {

    // sanity check
    if (isDead)
	return;
    
    var reverseMap = getNameToIDMap();
    var participantID = reverseMap[participantName];
    console.log("Voting function entered");

    // Locals
    var votesNeeded;
    var deadList = getDeadList();
    var newVoteCount;
    var deadListStringified;

    //////////////////////////////////////////////////
    /// Update the voting list 
    /////////////////////////////////////////////////
    var votingList = getVotingList();
    console.log("Adding vote for participant: ", participantID);
    if (participantID in votingList) { 
	count = votingList[key];
	votingList[key] = count + 1;
    } else {
	votingList[participantID] = 0;
    }
    

    ///////////////////////////////////////////////////
    /// Check number of votes
    //////////////////////////////////////////////////
    if (timeOfDay == "Night") { 
	if (participantRole != "Mafia") {
	    // TODO: Throw an error of some kind
	    return;
	} 
	votesNeeded = liveMafia;
    } else { // Daytime
	votesNeeded = getAlive();
    }
    newVoteCount = _state[voteCountKey] + 1;
    console.log("New vote count: ", newVoteCount);

    /////////////////////////////////////////////////
    // Push the dead list if necessary
    /////////////////////////////////////////////////
    if (newVoteCount == votesNeeded) {
	console.log("Number of votes needed to kill reached by participant: ", getParticipantID(), " with vote number: ", newVoteCount);
	var deadParticipant = findDeadPerson(votingList);
	console.log("Dead participant: ", deadParticipant);
	deadList.push(deadParticipant);
	console.log("New dead list: ", deadList);
	newVoteCount = 0;
	deadListStringified = JSON.stringify(deadList);
	gapi.hangout.data.submitDelta( { deadListKey: deadListStringified
				       });
    }

    ///////////////////////////////////////
    /// Always update the new vote count 
    ///////////////////////////////////////
    console.log("Participant: ", getParticipantID(), " pushing new vote count: ", newVoteVount);
    gapi.hangout.data.submitDelta( { voteCountKey : newVoteCount
					   });				     
    
    // Post method cleanup
    stopTimer();
	   

}


/**
   Updates the selection box on the main screen with the necessary elements from the participant list
*/
function updateSelectionBox() {
    console.log("Entering updateSelectionBox");
    var participantsArray = getAll();
    participantList = "<select id='voteBox'>";

    for (var i = 0; i < participantsArray.length; i++) {
	var participant = participantsArray[i];
	console.log("iterating through participant: ", participant);
	participantList += "<option value='" + participant + "'>" + participant + "</option>";
    }
    participantList += "</select>";
    console.log("playerRole HTML: " + participantList);
    $("#playerRole").empty();
    $("#playerRole").append(participantList);
}


/**
 The caller adds its own participant ID and name to the global reverse map
*/
function addSelfToReverseMap() {
    console.log("Adding participant ID: ", getParticipantID(), "to reverse map");
    var reverseMap = getNameToIDMap();
    var participant = gapi.hangout.getParticipantById(getParticipantID());
    reverseMap[participant.person.name] = getParticipantID();
    var reverseMapStringified = JSON.stringify(reverseMap);
    gapi.hangout.data.submitDelta( { nameToIDMapKey : reverseMapStringified
					       });	
}


/////////////////////////////
// Observer functions 
////////////////////////////
function stateChanged(delta, metadata) {
    console.log("received update for state with delta: ", delta);

    _state = delta.state;
    if (delta.state["gameStarted"] == "YES" && !gameInSession) { // Starting a new game, ask for our role
	gameInSession = true;
	console.log("Starting new game");
	askForRole();
	addSelfToReverseMap();
    } 


    getNumberOfLiveMafia(); // Update number of life mafia
    
    // Update the selection box
    updateSelectionBox();

    // Check if we're dead right now
    if (getParticipantID() in getDeadList()) {
	console.log("user ", getParticipantID(), " died");
	die(); 	// If so, time to die
	// TODO: Call function to cross dead person off list on front-end
    }
    
    var voteCount = parseInt(_state[voteCountKey]);
    
    if (voteCount == 0) { // switched from day to night or night to day
	if (timeOfDay == "Day") {
	    console.log("Switched from day to night");
	    changeTime("Night");
	} else {
	    console.log("Switched from night to day");
	    changeTime("Day");
	}
    }

}


function startClick() {
    console.log("startClick() called");
    var newGameID = getNewGameID();
    var putURL = globalURL + "newGame/" + newGameID + "/" + getAll().length;
    $.ajax({
	type: 'GET',
	url: putURL,
	success: function() {
		   console.log("Starting new game with game ID: ", newGameID);
		   gapi.hangout.data.submitDelta( { "gameStarted" : "YES"
						  });
	},
	error: function() {
		   console.log("Starting new game with game ID: ", newGameID);
		   gapi.hangout.data.submitDelta( { "gameStarted" : "YES"
						  });
	},				     
    });
}