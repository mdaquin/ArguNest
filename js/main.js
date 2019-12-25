var api_base = 'http://127.0.0.1:5000/'

var currentSelection = {};
var userkey;
var loadedtext;

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

function load_text(id){
    if (!is_loggedin()) {showlogin(); return;}
    loadedtext=id
    $.ajax({
	type: "POST",
	url: api_base+'text',
	data: JSON.stringify({ key: userkey, id: id }),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
		loadedtext=undefined
	    }
	    else {
		$('#al_text_panel').html(data.text)
		$('#al_text_list_dialog').css("display", "none")
	    }
	},
	failure: function(errMsg) {
	    loadedtext=undefined
	    alert("Server error: "+errMsg)
	}
    });        
}

function open_text(){
    if (!is_loggedin()) {showlogin(); return;}
    $.ajax({
	type: "POST",
	url: api_base+'texts',
	data: JSON.stringify({ key: userkey }),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error)
		alert("Error: "+data.error)
	    else {
		st = ""
		for(var i in data.list){
		    st += '<a href="javascript:load_text(\''+data.list[i].id+'\');" class="text_load_button">'+data.list[i].title+'</a><br/>'
		}
		$("#al_text_list_dialog").html(st)
		$("#al_text_list_dialog").css("display", "block")
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });        
}

function is_loggedin(){
    return userkey != undefined
}

function showlogin(){
    logout();
}

function logout(){
    userkey = undefined;
    $("#al_useremail").val("")
    $("#al_userpassword").val("")
    $("#al_login_message").html("")        
    $("#al_login_dialog").css("display", "block")
}

function login(){
    var email = $('#al_useremail').val()
    var password = $('#al_userpassword').val()
    if (!email) {
	$('#al_login_message').html("please provide an email address")
	return
    }
    if (!password) {
	$('#al_login_message').html("please provide a password")
	return
    }
    $('#al_login_message').html("")
    $.ajax({
	type: "POST",
	url: api_base+'login',
	data: JSON.stringify({ email: email, password: password }),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error)
		$('#al_login_message').html("Error: "+data.error)
	    else {
		userkey = data.key		
		$('#al_login_message').html("Success: "+data.message)
		$('#al_login_dialog').css('display', 'none')
	    }
	},
	failure: function(errMsg) {
	    $('#al_login_message').html("Server error: "+errMsg)
	}
    });        
}

function register(){
    var email = $('#al_useremail').val()
    var password = $('#al_userpassword').val()
    if (!email) {
	$('#al_login_message').html("please provide an email address")
	return
    }
    if (!password) {
	$('#al_login_message').html("please provide a password")
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
