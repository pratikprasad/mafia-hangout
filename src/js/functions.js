
// Client state
var participantRole = "";
var timeOfDay = "";
var timeout = null;
var isDead = false;
var liveMafia = 0;

// global variable keys
var globalURL = "http://ec2-174-129-51-197.compute-1.amazonaws.com/";
var deadListKey = "deadList";
var voteCountKey = "voteCount";
var numberMafiaKey = "numMafia";
var gameIDKey = "gameID";
var votingListKey = "votingList";


// TODO: Take out all junk calls

////////////////////
// Getter methods  
////////////////////

function getNewGameID() {
    return 1;
}

function getGameID() {
    return gapi.hangout.data.getState()[gameIDKey];
}

function getParticipantID() {
    return gapi.hangout.getParticipantId();    
}

function getDeadList() {
    return gapi.hangout.data.getState()[deadListKey];
}

function getAll() {
    var displayNameArray = [];
    var part_list = gapi.hangout.getEnabledParticipants();
    console.log("Got participant list");
    for (var i = 0; i < part_list.length; i++) {
	console.log("participant: " + part_list[i].person.displayName);
	displayNameArray.push(part_list[i].person.displayName);
    }
    return displayNameArray;
}

function getVotingList() {
    return JSON.Parse(gapi.hangout.data.getState()[votingListKey]);
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
    var getURL = globalURL + "addPlayer/" + gameID + "/" + getParticipantID();
    $.get(getURL, function(data) {
	console.log("Received role:", data);
	role = data;
    });
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
 @param participantID the participant ID to vote for.
*/
function voteForUser(participantID) {

    // sanity check
    if (isDead)
	return;

    // Locals
    var votesNeeded;
    var deadList = getDeadList();
    var newVoteCount;
    var deadListStringified;

    //////////////////////////////////////////////////
    /// Update the voting list 
    /////////////////////////////////////////////////
    var votingList = getVotingList();
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
	votesNeeded = getAll().length; // TODO: This needs to be # of live people, not all
    }
    newVoteCount = gapi.hangout.data.getState()[voteCountKey] + 1;

    /////////////////////////////////////////////////
    // Push the dead list if necessary
    /////////////////////////////////////////////////
    if (newVoteCount == votesNeeded) {
	console.log("Number of votes needed to kill reached by participant: ", getParticipantID(), " with vote number: ", newVoteCount);
	var deadParticipant = findDeadPerson(votingList);
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


/////////////////////////////
// Observer functions 
////////////////////////////
function stateChanged(delta, metadata) {
    getNumberOfLiveMafia(); // Update number of life mafia
    
    // Check if we're dead right now
    if (getParticipantID() in getDeadList()) {
	die(); 	// If so, time to die
	// TODO: Call function to cross dead person off list on front-end
    }
    
    var voteCount = parseInt(gapi.hangout.data.getState()[voteCountKey]);
    
    if (voteCount == 0) { // switched from day to night or night to day
	if (timeOfDay == "Day") {
	    changeTime("Night");
	} else {
	    changeTime("Day");
	}
    }

    if (gameIDKey in delta) { // Starting a new game, ask for our role
	askForRole();
    }
}


function startClick() {
    var gameIDKey = getNewGameID();
    var putURL = globalURL + "newGame/" + gameIDKey + "/" + getAll().length;

    jquery.get(putURL, function(){
	    if (getGameID() != null) {
		gapi.hangout.data.submitDelta( { gameIDKey : newGameID
					       });				     

	    }
	});
}