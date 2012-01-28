
// Client state
var participantRole = "";
var timeOfDay = "";
var timeout = null;
var isDead = false;
var liveMafia = 0;

// global variable keys
var globalURL = "http://ec2-174-129-51-197.compute-1.amazonaws.com/";
var deadListKey = "deadList";
var dayVoteNumberKey = "dayVoteNumber";
var nightVoteNumberKey = "nightVoteNumber";
var numberMafiaKey = "numMafia";
var gameIDKey = "gameID";
var votingListKey = "votingList";

// TODO: Take out all junk calls

////////////////////
// Getter methods  
////////////////////

function getGameID() {
    //return gapi.hangout.data.getState()[gameIDKey];
    return "junk";
}

function getParticipantID() {
    //return gapi.hangout.getParticipantId();
    return "1";
}

function getDeadList() {
    return ["1", "2"];
    //return gapi.hangout.data.getState()[deadListKey];
}

function getAll() {
    //return gapi.hangout.getEnabledParticipants();
    return ["1", "2", "3", "4", "5", "6"];
}

function getVotingList() {
    return {"1": 1, "2", 1};
    //return JSON.Parse(gapi.hangout.data.getState()[votingListKey]);
}

function getAliveList() {
    masterList = getAll();
    deadList = getDeadList();
    for(var i = 0; i < myArray.length; i++){             
	if(masterList[i] in deadList){ 
            masterList.splice(i,1);    
	}
    }
    return masterList;
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
    var getURL = globalURL + "numMafia/" + junk;
    $.get(getURL,
	   function(data) {
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
v

/**
 Client-side function that votes for a participant to be killed. Meant for both mafia and villagers.
 @param participantID the participant ID to vote for.
*/
function voteForUser(participantID) {

    // sanity check
    if (isDead)
	return;

    // Locals
    var voteCountKey;
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
	voteCountKey = nightVoteNumberKey;
	votesNeeded = liveMafia;
    } else { // Daytime
	voteCountKey = dayVoteNumberKey;
	votesNeeded = getAll().length;
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
	gapi.hangout.data.submitDelta( { "deadList": deadListStringified
				       });
    }

    ///////////////////////////////////////
    /// Always update the new vote count 
    ///////////////////////////////////////
    console.log("Participant: ", getParticipantID(), " pushing new vote count: ", newVoteVount);
    gapi.hangout.data.submitDelta( { "voteCount" : newVoteCount,
					   });				     
    
    // Post method cleanup
    stopTimer();
	   
}
