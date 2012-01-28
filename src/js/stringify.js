function initNamesToIDs() {
    var pid = gapi.hangout.getPartitipantId();
    var ptcp = gapi.hangout.getParticipantById(pid);
    var pname = ptcp.person.displayname
    gapi.hangout.data.submitDelta({ pname : pid });
}

function inputVote() {
    var name = $("#Vote").val();
    var pid = gapi.hangout.data.getState()[name];    
    voteForUser(pid);
}
