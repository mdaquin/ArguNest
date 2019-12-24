// check logged in
// if not show dialog
// multiple topic dropdown

// on open text - show text
// show right stuff - blocked when no annotation / show editing
// annotation event (armalian)
// annotation click
// auto complete on title
// add stated by the author - reference to someone else's statement
// free text about how/what is referenced


var api_base = 'http://127.0.0.1:5000/'

var currentSelection = {};
var userkey;

$( document ).ready(function() {
    fill_select('al_highlights')
    fill_select('al_an_topic_1')
    document.addEventListener("selectionchange", function(){
	var sel = window.getSelection();
	var len = sel.focusOffset-sel.anchorOffset;
	if (len>10){
	    currentSelection.start = sel.anchorOffset;
	    currentSelection.lenght = len;
	    currentSelection.text = sel.anchorNode.data.substr(currentSelection.start, currentSelection.lenght);
	    console.log(currentSelection);
	    // remove additional topics
	    fill_select('al_an_topic_1')
	}
    });
    
});

function fill_select(el){
    var st1 = '<option value="none">-- concept --</option>'
    for(var i in topics){
	var reduced = dbp_frag(topics[i])
	var opt_string = '<option value="'+reduced+'">'+reduced.replace(/_/g,' ')+'</option>'
	st1+=opt_string
    }
    document.getElementById(el).innerHTML=st1
}

function dbp_frag(u){
    return u.substring(u.lastIndexOf('/')+1)
}

function register(){
    var email = $('#al_useremail').val()
    var password = $('#al_userpassword').val()
    if (!email) {
	$('#al_login_message').html("please provide an email address")
	return
    }
    if (!password) {
	$('#al_login_message').html("please provide an password")
	return
    }
    $('#al_login_message').html("")
    $.ajax({
	type: "POST",
	url: api_base+'register',
	data: JSON.stringify({ email: email, password: password }),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    console.log(data)
	    if(data.error)
		$('#al_login_message').html("Error: "+data.error)
	    else {
		$('#al_login_message').html("Success: "+data.message)
	    }
	},
	failure: function(errMsg) {
	    $('#al_login_message').html("Server error: "+errMsg)
	}
    });    
}
