var api_base = 'http://127.0.0.1:5000/'

var currentSelection = undefined
var userkey
var loadedtext
var currentannotation
var topic_count = 1

var annotations = {}

$( document ).ready(function() {
    fill_select('al_highlights')
    fill_select('al_an_topic_1')
    document.addEventListener("selectionchange", function(){
	var sel = window.getSelection()
	var len = sel.focusOffset-sel.anchorOffset
	if (Math.abs(len)>5){
	    currentSelection = {}
	    console.log(sel.toString())
	    currentSelection.start = sel.anchorOffset
	    currentSelection.lenght = len
	    // currentSelection.text = sel.anchorNode.data.substr(currentSelection.start, currentSelection.lenght)
	    currentSelection.text = sel.toString();
	    // console.log(currentSelection);
	    currentSelection.id = undefined
	    init_annotation();
	} else {
	    // have to keep it for the change!!
	    //currentSelection = undefined
	}
    });
    $("#al_an_title").change(function(){update_annotation()})
    $("#al_an_type_arg").change(function(){update_annotation()})
    $("#al_an_type_prop").change(function(){update_annotation()})
    $("#al_an_ref_stated").change(function(){
	if (document.getElementById("al_an_ref_other").checked)
	    $("#al_reference").css("display","block")
	else
	    $("#al_reference").css("display","none")
	update_annotation()
    })
    $("#al_an_ref_other").change(function(){
	if (document.getElementById("al_an_ref_other").checked)
	    $("#al_reference").css("display","block")
	else
	    $("#al_reference").css("display","none")	    
	update_annotation()
    })
    $("#al_reference").change(function(){update_annotation()})
    $("#al_an_topic_1").change(function(){topic_updated(1)})
});

function init_annotation(){
    for (var i = topic_count; i > 1; i--)
	$("#al_an_topic_"+i).remove()
    topic_count = 1
    fill_select('al_an_topic_1')
    $("#al_an_title").val("")
    // clear graph
    $("#al_delete_button").css("display", "none")
    $("#al_an_ref_stated").prop("checked", true)
    $("#al_reference").css("display","none")
    $("#al_reference").val("")    
}

function new_topic_select(){
    var st = '<select id="al_an_topic_'+(topic_count+1)+'" class="al_an_topic">'
    st += $('#al_an_topic_'+topic_count).html()
    st += '</select>'
    $("#al_topic_selects").append(st)
    topic_count++
    var n = topic_count
    $("#al_an_topic_"+topic_count).change(function(){topic_updated(n)})
}


function topic_updated(n){
    if (!$("#al_an_topic_"+(n+1)).length){
	new_topic_select()
    }
    update_annotation()
}

// base hasfunction
// from https://gist.github.com/iperelivskiy/4110988
var funhash = function(s) {
    for(var i = 0, h = 0xdeadbeef; i < s.length; i++)
        h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    return (h ^ h >>> 16) >>> 0;
}

function update_annotation(){
    var aid
    var text
    var type
    var ref
    var topics = []
    $("#al_delete_button").css("display", "inline")
    if (currentSelection) {
	if (currentSelection.id){
	    aid = currentSelection.id
	} else {
	    aid = userkey+"-"+loadedtext+"-"+funhash(currentSelection.text)
	}
    }
    var atext = currentSelection.text
    if ($("#ann_"+aid).length && annotations[aid]){
	atext = annotations[aid].text
    } else {
	text = $("#al_text_panel").html()
	text = text.replace(currentSelection.text, '<span class="al_ann" id="ann_'+aid+'">'+currentSelection.text+'</span>')
	$("#al_text_panel").html(text)	
    }
    $(".al_ann").css("font-weight", "normal")
    $("#ann_"+aid).css("font-weight", "600")
    type = "proposition"
    if (document.getElementById("al_an_type_arg").checked) type = "argument"
    ref = "stated"
    if (document.getElementById("al_an_ref_other").checked) ref = "other"    
    for(var i = 1; i <= topic_count; i++)
	topics.push($("#al_an_topic_"+i).val())
    if (!annotations[aid]) annotations[aid] = {}    
    annotations[aid].text  = atext
    annotations[aid].type  = type
    annotations[aid].title  = $("#al_an_title").val()
    annotations[aid].ref    = ref
    annotations[aid].refto  = $("#al_reference").val()
    annotations[aid].topics = topics
    if (type=="argument")
	$("#ann_"+aid).css("background", "#cfc")
    else
	$("#ann_"+aid).css("background", "#ccf")
    $('#ann_'+aid).removeAttr('onclick');
    $('#ann_'+aid).attr('onClick', 'selectOnClick("'+aid+'");');
}

function selectOnClick(aid){
    $(".al_ann").css("font-weight", "normal")
    $("#ann_"+aid).css("font-weight", "600")
    init_annotation()
    $("#al_delete_button").css("display", "inline")
    currentSelection.id = aid
    if (annotations[aid]){
	$("#al_an_title").val(annotations[aid].title)
	if (annotations[aid].type=="argument")
	    $("#al_an_type_arg").prop("checked", true)
	else
	    $("#al_an_type_prop").prop("checked", true)
	if (annotations[aid].ref=="stated"){
	    $("#al_an_ref_stated").prop("checked", true)
	    $("#al_reference").css("display", "none")
	}
	else {
	    $("#al_an_ref_other").prop("checked", true)
	    $("#al_reference").css("display", "block")	    
	}
	$("#al_reference").val(annotations[aid].refto)
	$("#al_an_topic_1").val(annotations[aid].topics[0])
	for(var i = 2; i <= annotations[aid].topics.length; i++){
	    new_topic_select()
	    $("#al_an_topic_"+i).val(annotations[aid].topics[i-1])	    
	}
    } else {
	console.log("annotation selected that does not exist...")
    }
}

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
