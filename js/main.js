

      // check logged in
      // if not show dialog

      // on open text - show text
      // show right stuff - blocked when no annotation / show editing
      // annotation event (armalian)
      // annotation click

var currentSelection = {};

$( document ).ready(function() {
    init_panel(false);
    document.addEventListener("selectionchange", function(){
	var sel = window.getSelection();
	var len = sel.focusOffset-sel.anchorOffset;
	if (len>3){
	    currentSelection.start = sel.anchorOffset;
	    currentSelection.lenght = len;
	    currentSelection.text = sel.anchorNode.data.substr(currentSelection.start, currentSelection.lenght);
	    console.log(currentSelection);
	    init_panel(true);
	}
    });
});


function init_panel(topic_only){
    fill_selects(topic_only);
}

function fill_selects(topic_only){
    var st1 = '<option value="none">-- highlights --</option>'
    var st2 = '<option value="none">-- topic --</option>'
    for(var i in topics){
	var reduced = dbp_frag(topics[i])
	var opt_string = '<option value="'+reduced+'">'+reduced.replace(/_/g,' ')+'</option>'
	st1+=opt_string
	st2+=opt_string
    }
    if(!topic_only)
	document.getElementById('al_highlights').innerHTML=st1
    document.getElementById('al_an_topic_1').innerHTML=st2
}


function dbp_frag(u){
    return u.substring(u.lastIndexOf('/')+1)
}
