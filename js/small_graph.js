
// based on http://bl.ocks.org/MoritzStefaner/raw/1377729/
function show_graph(aid, key){
    var obj = {"id": aid, "key": key};
    var aaid = aid;
    $("#al_graph_panel").html('')
    $.ajax({
	type: "POST",
	url: api_base+'ann_graph',
	data: JSON.stringify(obj),
	contentType: "application/json; charset=utf-8",
	dataType: "json",
	success: function(data){
	    if(data.error){
		alert("Error: "+data.error)
	    }
	    else {
		var tnodes = data.nodes;
		var w = $("#al_graph_panel").width(), h = 200;
		var labelDistance = 0;    
		var vis = d3.select("#al_graph_panel").append("svg:svg").attr("width", w).attr("height", h).attr("id","al_small_graph");
		var labelAnchors = [];
		var labelAnchorLinks = [];
		var links = [];
		var nodes = [];
		for(var i in tnodes){
		    nodes.push(tnodes[i])
		    labelAnchors.push({
			node : nodes[i]
		    });
		    labelAnchors.push({
			node : nodes[i]
		    });	
		}
		for(var i = 0; i < nodes.length; i++) {
		    for(var j = 0; j < i; j++) {
			if (!nodes[i].supports) nodes[i].supports = []
			if (!nodes[i].contradicts) nodes[i].contradicts = []
			if (!nodes[i].same) nodes[i].same = []
			if (!nodes[j].supports) nodes[j].supports = []
			if (!nodes[j].contradicts) nodes[j].contradicts = []
			if (!nodes[j].same) nodes[j].same = []			
			if (nodes[i].linkto.includes(nodes[j].id)){
			    links.push({
				source : i,
				target : j,
				weight : 1,
				type: "topic"
			    });
			}
			if (nodes[j].linkto.includes(nodes[i].id)){
			    links.push({
				source : j,
				target : i,
				weight : 1,
				type: "topic"
			    });
			}
			if (nodes[i].supports.includes(nodes[j].id)){
			    links.push({
				source : i,
				target : j,
				weight : 1,
				type   : "supports"
			    });
			}
			if (nodes[j].supports.includes(nodes[i].id)){
			    links.push({
				source : j,
				target : i,
				weight : 1,
				type   : "supports"				
			    });
			}
			if (nodes[i].contradicts.includes(nodes[j].id)){
			    links.push({
				source : i,
				target : j,
				weight : 1,
				type   : "contradicts"
			    });
			}
			if (nodes[j].contradicts.includes(nodes[i].id)){
			    links.push({
				source : j,
				target : i,
				weight : 1,
				type   : "contradicts"				
			    });
			}
			if (nodes[i].same.includes(nodes[j].id)){
			    links.push({
				source : i,
				target : j,
				weight : 1,
				type   : "same"
			    });
			}
			if (nodes[j].same.includes(nodes[i].id)){
			    links.push({
				source : j,
				target : i,
				weight : 1,
				type   : "same"				
			    });
			}			
		    }
		    labelAnchorLinks.push({
			source : i * 2,
			target : i * 2 + 1,
			weight : 1
		    });
		};
		var force = d3.layout.force().size([w, h]).nodes(nodes).links(links).gravity(1).linkDistance(40).charge(-2000).linkStrength(function(x) {
		    return x.weight * 10
		});
		force.start();
		var force2 = d3.layout.force().nodes(labelAnchors).links(labelAnchorLinks).gravity(0).linkDistance(0).linkStrength(8).charge(-200).size([w, h]);
		force2.start();
		var link = vis.selectAll("line.link").data(links).enter().append("svg:line").attr("class", "link").style("stroke",  function (l){
		    if (l.type=="same") return "#000"
		    if (l.type=="supports") return "#5a5"
		    if (l.type=="contradicts") return "#a55"	    
		    return "#CCC"
		}).style("stroke-width", function (l){
		    if (l.type=="same") return "2"
		    if (l.type=="supports") return "2"
		    if (l.type=="contradicts") return "2"	    
		    return "1"
		});
		var node = vis.selectAll("g.node").data(force.nodes()).enter().append("svg:g").attr("class", "node");
		node.append("svg:circle").attr("r", 10).style("fill",
							      function(d){
								  if (d.id==aaid)
								      return "#800"
								  if (d.type=="argument")
								      return "#74be74"
								  if (d.type=="proposition")
								      return "#7474be"
								  return "#555"
							      }).style("stroke", "#FFF").style("stroke-width", 3).on("click", function(d){
								  if (d.type!="concept")
								      selectOnClick(d.id);
							      });
		node.call(force.drag);
		var anchorLink = vis.selectAll("line.anchorLink").data(labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");
		var anchorNode = vis.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
		anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
		anchorNode.append("svg:text").text(function(d, i) {
		    return i % 2 == 0 ? "" : d.node.label
		}).style("fill", "#555").style("font-family", "Arial").style("font-size", 12);
		
		var updateLink = function() {
		    this.attr("x1", function(d) {
			return d.source.x;
		    }).attr("y1", function(d) {
			return d.source.y;
		    }).attr("x2", function(d) {
			return d.target.x;
		    }).attr("y2", function(d) {
			return d.target.y;
		    });
		    
		}
		
		var updateNode = function() {
		    this.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		    });
		    
		}
		
		force.on("tick", function() {	
		    force2.start();	
		    node.call(updateNode);    
		    anchorNode.each(function(d, i) {
			if(i % 2 == 0) {
			    d.x = d.node.x;
			    d.y = d.node.y;
			} else {
			    var b = this.childNodes[1].getBBox();		
			    var diffX = d.x - d.node.x;
			    var diffY = d.y - d.node.y;		
			    var dist = Math.sqrt(diffX * diffX + diffY * diffY);		
			    var shiftX = b.width * (diffX - dist) / (dist * 2);
			    shiftX = Math.max(-b.width, Math.min(0, shiftX));
			    var shiftY = 5;
			    this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
			}
		    });
		    
		    anchorNode.call(updateNode);
		    
		    link.call(updateLink);
		    anchorLink.call(updateLink);
		    
		});
	    }
	},
	failure: function(errMsg) {
	    alert("Server error: "+errMsg)
	}
    });      
}
