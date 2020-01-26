var api_base = 'http://afel.insight-centre.org/ArguNest/api/'

var currentSelection = undefined
var userkey
var loadedtext
var loadedtexttext
var currentannotation
var topic_count = 1
var currentview = "annotation"
var annotations = {}
var relations = {}
var topics = []

$( document ).ready(function() {
    fill_select('al_highlights')
    fill_select('al_an_topic_1')
    document.addEventListener("selectionchange", function(){
	var sel = window.getSelection()
	var len = sel.focusOffset-sel.anchorOffset
	if (Math.abs(len)>5){
	    $("#al_annotation_panel_sub").css("display", "block")
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
    $("#al_highlights").change(function(){highlight();showdef();})
    $("#al_an_title").change(function(){allog("changed title", ""); update_annotation()})
    $("#al_an_type_arg").change(function(){allog("switch ann type", "arg"); update_annotation()})
    $("#al_an_type_prop").change(function(){allog("switch ann type", "prop"); update_annotation()})
    $("#al_an_ref_stated").change(function(){
	if (document.getElementById("al_an_ref_other").checked)
	    $("#al_reference").css("display","block")
	else
	    $("#al_reference").css("display","none")
	allog("switch statement orig", "stated")
	update_annotation()
    })
    $("#al_an_ref_other").change(function(){
	if (document.getElementById("al_an_ref_other").checked)
	    $("#al_reference").css("display","block")
	else
	    $("#al_reference").css("display","none")	    
	allog("switch statement orig", "other")
	update_annotation()
    })
    $("#al_reference").change(function(){allog("update reference", ""); update_annotation()})
    $("#al_an_topic_1").change(function(){allog("update topic", ""); topic_updated(1)})
    $("#al_rel_origin").change(function(){allog("chose rel origin", ""); showRelsInPanel()})
});


var definitiontext = ''
var fulldefinition = false

function allog(mess, par){
    var obj = {"key": userkey, "message": mess, "param": par}
    $.ajax({
	type: "POST",
	url: api_base+'log',
	data: JSON.stringify(obj),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		console.log(data)
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });            
}

function showdef(){
    var cid = $("#al_highlights").val()
    for (var i in topics){
	if (topics[i].label == cid){
	    cid = topics[i].wdid
	}
    }
    var obj = {'id': cid}
    $.ajax({
	type: "POST",
	url: 'http://afel.insight-centre.org/ArguNest/pmiapi/def',
	data: JSON.stringify(obj),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		fulldefinition = false
		definitiontext = data.definition.replace(/\\/g, '')
		$('#al_definition_text').html(definitiontext.substring(0,200))
		if (definitiontext.length > 300){
		    $('#al_definition_text').html(definitiontext.substring(0,300)+'...')
		    $('#al_full_definition_but').css('display', 'inline')
		    $('#al_full_definition_but').html('more...')
		} else {
		    $('#al_full_definition_but').css('display', 'none')
		}
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });        
}

function toogleFullDefinition(){
    if (fulldefinition){
	allog("swith full definition", "false")
	fulldefinition=false
	$('#al_definition_text').html(definitiontext.substring(0,300)+'...')	
	$('#al_full_definition_but').html('more...')	
    } else {
	allog("swith full definition", "true")
	fulldefinition=true
	$('#al_definition_text').html(definitiontext)
	$('#al_full_definition_but').html('less...')		
    }
}

function highlight(){
    var cid = $("#al_highlights").val()    
    for (var i in topics){
	if (topics[i].label == cid){
	    cid = topics[i].wdid
	}
    }
    allog("highlight", cid)
    var text = $("#al_text_panel").text()
    var obj = {'id': cid, 'text': text}
    $("#al_highlight_panel").html(loadedtexttext)
    $.ajax({
	type: "POST",
	url: 'http://afel.insight-centre.org/ArguNest/pmiapi/pmi',
	data: JSON.stringify(obj),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		// rank terms
		var items = Object.keys(data).map(function(key) {
		    return [key, data[key]];
		});
		items.sort(function(first, second) {
		    return second[1] - first[1];
		});
		// highlight a third of the words in text
		// with decreasing intensity
		var dec = 1 / (items.length / 3)
		var score = 1
		$("#al_words_classes").html("")
		var stst = ""		
		for(var i in items){
		    console.log(items[i][0]+" "+score)
		    stst += highlightword(items[i][0], score)
		    score = score - dec
		    items[i].push(score)
		    if (score <= 0.0) break		    
		}		
		$("#al_highlight_panel").children().each(function(){
		    var text = $(this).html()	
		    for (var i in items){
			if (items[i].length == 3){
			    var w = items[i][0]
			    text = text.replace(new RegExp('\\b'+w+'\\b', "g"),
						'<span class="al_word_'+w+'">'+w+'</span>')
			} else{
			    break
			}
		    }
		    $(this).html(text)
		});							
		$("#al_words_classes").text(stst)
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });        
}

function highlightword(w,s){
    if (s > 0){
	var colour = 'rgba(255,150,150, '+s+')'
	return '\n.al_word_'+w+'{border:0px; padding:0px; background: '+colour+'}'
    }
    return ''
}

function init_annotation(){
    for (var i = topic_count; i > 1; i--)
	$("#al_an_topic_"+i).remove()
    topic_count = 1
    fill_select('al_an_topic_1')
    $("#al_an_title").val("")
    $("#al_delete_button").css("display", "none")
    $("#al_an_ref_stated").prop("checked", true)
    $("#al_reference").css("display","none")
    $("#al_reference").val("")
    $("#al_graph_panel").html('')
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
    allog("change topic", "") 
    if (!$("#al_an_topic_"+(n+1)).length){
	new_topic_select()
    }
    update_annotation()
}

function show_annotations(){
    for (var aid in annotations){
	create_annotation_span(aid, annotations[aid].text)
	if (annotations[aid].type=="argument")
	    $("#ann_"+aid).css("background", "#cfc")
	else
	    $("#ann_"+aid).css("background", "#ccf")
	$('#ann_'+aid).attr('onClick', 'selectOnClick("'+aid+'");');
    }
}

// base hasfunction
// from https://gist.github.com/iperelivskiy/4110988
var funhash = function(s) {
    for(var i = 0, h = 0xdeadbeef; i < s.length; i++)
        h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    return (h ^ h >>> 16) >>> 0;
}

function create_annotation_span(aid, atext){
    text = $("#al_text_panel").html()
    text = text.replace(atext, '<span class="al_ann" id="ann_'+aid+'">'+atext+'</span>')
    $("#al_text_panel").html(text)	
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
    allog("updating annotation", aid)
    var atext = currentSelection.text
    if ($("#ann_"+aid).length && annotations[aid]){
	atext = annotations[aid].text
    } else {
	create_annotation_span(aid, atext, type)
    }
    $(".al_ann").css("font-weight", "normal")
    $("#ann_"+aid).css("font-weight", "600")
    type = "proposition"
    if (document.getElementById("al_an_type_arg").checked) type = "argument"
    if (type=="argument")
	$("#ann_"+aid).css("background", "#cfc")
    else
	$("#ann_"+aid).css("background", "#ccf")
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
    annotations[aid].user   = userkey
    annotations[aid].doc    = loadedtext
    annotations[aid].id     = aid
    $('#ann_'+aid).removeAttr('onclick');
    $('#ann_'+aid).attr('onClick', 'selectOnClick("'+aid+'");');
    saveAnnotation(annotations[aid])
    currentSelection.id = aid
}

function delete_annotation(){
    var aid = currentSelection.id
    allog("deleting annotation", aid)
    console.log(aid)
    console.log(currentSelection)
    $("#ann_"+aid).replaceWith(function() {return $(this).html(); });
    annotations[aid] = undefined
    var obj = {"key": userkey, "aid": aid}
    init_annotation()
    $.ajax({
	type: "POST",
	url: api_base+'annotation/delete',
	data: JSON.stringify(obj),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		console.log(data)
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });        
}

function deleteRelation(o,r,t){
    var obj = {key: userkey, doc: loadedtext,
	       origin:o, relation:r, target:t}
    allog("deleting relation", o+"-"+r+"-"+t)
    init_annotation()
    $.ajax({
	type: "POST",
	url: api_base+'relation/delete',
	data: JSON.stringify(obj),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		console.log(data)
		relations[o][r] = relations[o][r].filter(function(value, index, arr){return value != t;});
		for(var n in tnodes){
		    if (tnodes[n].id == o){
			node = tnodes[n]
			node[r] = node[r].filter(function(value, index, arr){return value != t;});			
		    }
		}
		visGraph();
		showRelsInPanel();		
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });        
}

function saveAnnotation(ann){
    $.ajax({
	type: "POST",
	url: api_base+'annotation',
	data: JSON.stringify(ann),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		show_graph(data.id, userkey)
		console.log(data)
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });
}

function selectOnClick(aid){
    $(".al_ann").css("font-weight", "normal")
    console.log("selected "+aid)
    allog("selected annotation", aid)
    $("#ann_"+aid).css("font-weight", "600")
    init_annotation()
    $("#al_delete_button").css("display", "inline")
    if (!currentSelection) currentSelection = {}
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
    show_graph(aid, userkey)
    $("#al_annotation_panel_sub").css("display", "block")
}

function fill_select(el){
    var st1 = '<option value="none">-- concept --</option>'
    for(var i in topics){
	var opt_string = '<option value="'+topics[i].label+'">'+topics[i].label+'</option>'
	st1+=opt_string
    }
    document.getElementById(el).innerHTML=st1
}

function dbp_frag(u){
    return u.substring(u.lastIndexOf('/')+1)
}

function load_text(id){
    if (!is_loggedin()) {showlogin(); return;}
    init_annotation()
    loadedtext=id
    allog("loading text", id)
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
		topics = data.taxonomy
		$("#al_graph_panel").html('<div id="al_help_mss">Select text and edit above to create annotation. Click on an annotation in the text to see it here.</div>')
		fill_select('al_highlights')
		fill_select('al_an_topic_1')
		loadedtexttext = data.text
		$('#al_text_panel').html(data.text)
		$('#al_highlight_panel').html(data.text)		
		$('#al_text_list_dialog').css("display", "none")
		annotations = {}
		for (var i in data.annotations)
		    annotations[data.annotations[i].id] = data.annotations[i]
		relations = data.relations
		show_annotations()
		$("#al_annotation_panel_sub").css("display", "none")
		$("#al_annotation_panel").css("display", "block")
	    }
	},
	failure: function(errMsg) {
	    loadedtext=undefined
	    alert("Server error: "+errMsg)
	}
    });        
}

function open_text(){
    if (currentview=="graph") switchView();
    if (!is_loggedin()) {showlogin(); return;}
    allog("opening text", "")
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
		var st = ""
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
    allog("logout", "")    
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
		allog("login", "")
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

function fillRelSelect(){
    var st = ""
    for (var ann in annotations){
	if (annotations[ann] && annotations[ann].type)
	    st+= '<option value="'+ann+'">'+annotations[ann].type+":"+annotations[ann].title+'</option>'
    }
    $("#al_rel_origin").html(st)
    $("#al_rel_target").html(st)    
}

function saveRelation(){
    var origin = $("#al_rel_origin").val()
    var rel    = $("#al_relation").val()
    var target = $("#al_rel_target").val()
    allog("saving relation", origin+"-"+rel+"-"+target)
    if (!relations[origin]) relations[origin] = {}
    if (!relations[origin][rel]) relations[origin][rel] = []
    relations[origin][rel].push(target)
    showRelInGraph(origin, rel, target)
    showRelsInPanel();
    saveRel(origin, rel, target)
}

function saveRel(origin, rel, target){
    var obj = {key: userkey,
	       origin: origin,
	       relation: rel,
	       target: target,
	       doc: loadedtext
	      }
    $.ajax({
	type: "POST",
	url: api_base+'relation',
	data: JSON.stringify(obj),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		console.log(data)
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });
}

function showRelsInPanel(){
    var origin = $("#al_rel_origin").val()
    console.log("origin: "+origin)
    console.log(relations[origin])    
    var st = "<h2>"+annotations[origin].type+": "+annotations[origin].title+"</h2>"
    if (relations[origin]){	
	if (relations[origin]["same"]){
	    st += '<h3>existing "same" relation</h3>'
	    for (var i in relations[origin]["same"]){
		st+= '<div class="al_ex_rel">'
		var target = relations[origin]["same"][i]
		if (annotations[target]){
		    st += annotations[target].type+": "+annotations[target].title
		    st += ' <a href="javascript:deleteRelation(\''+origin+'\',\'same\',\''+target+'\');">(delete)</a>'
		}
		st+= '</div>'
	    }	    
	}
	if (relations[origin]["supports"]){
	    st += '<h3>existing "supports" relation</h3>'
	    for (var i in relations[origin]["supports"]){
		st+= '<div class="al_ex_rel">'
		var target = relations[origin]["supports"][i]
		if (annotations[target]){
		    st += annotations[target].type+": "+annotations[target].title
		    st += ' <a href="javascript:deleteRelation(\''+origin+'\',\'supports\',\''+target+'\');">(delete)</a>'
		}
		st+= '</div>'
	    }	    
	}
	if (relations[origin]["contradicts"]){
	    st += '<h3>existing "contradicts" relation</h3>'
	    for (var i in relations[origin]["contradicts"]){
		st+= '<div class="al_ex_rel">'
		var target = relations[origin]["contradicts"][i]
		if (annotations[target]){
		    st += annotations[target].type+": "+annotations[target].title
		    st += ' <a href="javascript:deleteRelation(\''+origin+'\',\'contradicts\',\''+target+'\');">(delete)</a>'
		}
		st+= '</div>'
	    }	    
	}	
    }
    $("#al_existing_rel").html(st)
}

function switchView(){
    if (currentview=="annotation"){
	allog("switch view", "graph")
	$("#al_text_panel").css("display", "none")
	$("#al_highlight_panel").css("display", "none")	
	$("#al_annotation_panel").css("display", "none")
	$("#al_l_graph_panel").css("display", "block")
	$("#al_relation_panel").css("display", "block")
	$("#al_switch_view").html("Switch to Annotation View")
	show_large_graph(userkey, loadedtext)
	fillRelSelect();
	currentview="graph"
	showRelsInPanel();
    } else {
	allog("switch view", "annotation")
	$("#al_text_panel").css("display", "block")
	$("#al_highlight_panel").css("display", "block")	
	$("#al_annotation_panel").css("display", "block")
	$("#al_l_graph_panel").css("display", "none")
	$("#al_relation_panel").css("display", "none")
	currentview="annotation"
	$("#al_switch_view").html("Switch to Graph View")	
    }
}
