/**
 * Add links for all parent comments of current comment.
 * Links with lower number are higher in the comments thread.
 * 
 * @param {number} currentIdx    - Index of current comment.
 * @param {number} currentIndent - Indent of current comment.
 * @param {number} parentIndent  - Indent of the direct (closest) parent.
 */
function addParents(currentIdx, currentIndent, parentIndent) {
	// Return if this is a comment without parents
	if (parentIndent < 0) {
		return;
	}

	var parentNum = parentIndent / 40 + 1;
	var text, parentComment;

	// Container of links to parents
	var parentsDiv = document.createElement('div');
	parentsDiv.classList.add('hnp-links-container');
	parentsDiv.innerText = 'Parents:';
	var links = document.createElement('div');
	links.classList.add('hnp-parent-links');
	parentsDiv.appendChild(links);
	
	// Add all parents of the current comment
	while (parentIndent >= 0) {
		parentComment = getParentComment(currentIdx, parentIndent);
		text = parentComment.getElementsByClassName('comment')[0].innerText;
		text = text.replace(/\sreply$/g, ''); // Remove last 'reply' string in comment text
		addLink(true, text, currentIndent, parentNum, parentComment.id, links);
		parentNum--;
		parentIndent -= 40;
	}

	var commentHeader = allComments[currentIdx].getElementsByClassName('comhead')[0];
	commentHeader.insertBefore(parentsDiv, commentHeader.firstChild); // Insert on first place
	adjustLeftOffset('hnp-parent-links', currentIdx);
}

/**
 * Add links for all direct replies to the current comment.
 * Links with lower number are higher in the comments thread.
 * 
 * @param {number} currentIdx    - Index of current comment.
 * @param {number} currentIndent - Indent of current comment.
 * @param {number} replyIndent   - Indent of all replies to the current comment.
 */
function addReplies(currentIdx, currentIndent, replyIndent) {
	// Return if this is the last comment
	if (currentIdx + 1 === totalComments) {
		return;
	}
	// Return if comment has no replies
	if (allComments[currentIdx + 1].querySelector('TR > TD > TABLE > TBODY > TR > TD.ind > img').width <= currentIndent) {
		return;
	}

	// Container of links to replies
	var repliesDiv = document.createElement('div');
	repliesDiv.classList.add('comhead'); // Match font in comment header
	repliesDiv.classList.add('hnp-links-container');
	repliesDiv.innerText = 'Replies: ';
	var links = document.createElement('div');
	links.classList.add('hnp-reply-links');
	repliesDiv.appendChild(links);

	var i = currentIdx + 1;
	var replyNum = 1;
	// Loop until there are no more comments or it gets to next comment in same depth/level as current comment
	while (i < totalComments && allComments[i].querySelector('TR > TD > TABLE > TBODY > TR > TD.ind > img').width > currentIndent) {
		if (allComments[i].querySelector('TR > TD > TABLE > TBODY > TR > TD.ind > img').width === replyIndent) {
			text = allComments[i].getElementsByClassName('comment')[0].innerText;
			text = text.replace(/\sreply$/g, ''); // Remove last 'reply' string in comment text
			addLink(false, text, currentIndent, replyNum, allComments[i].id, links);
			replyNum++;
		}
		i++;
	}

	var commentDiv = allComments[currentIdx].getElementsByClassName('default')[0];
	commentDiv.appendChild(repliesDiv);
	adjustLeftOffset('hnp-reply-links', currentIdx);
}

/**
 * Return the direct parent of a comment.
 * 
 * @param {number} currentIdx   - Index of current comment in the global array of all comments.
 * @param {number} parentIndent - Indent of the direct parent.
 */
function getParentComment(currentIdx, parentIndent) {
	for (var i = currentIdx - 1; i >= 0; i--) {
		if (allComments[i].querySelector('TR > TD > TABLE > TBODY > TR > TD.ind > img').width === parentIndent) {
			return allComments[i];
		}
	}
	return null;
}

/**
 * Append a hoverable link to the linksDiv container for the current comment.
 * The link will point to a parent or reply of the current comment.
 * 
 * @param {boolean} parents      - If true linksDiv contains links to parent comments, else it contains replies. 
 * @param {string} text          - Text content of a parent comment or reply.
 * @param {number} commentIndent - Indent of the current comment in pixels.
 * @param {number} linkNum       - Ordinal number of the link.
 * @param {string} linkId        - Id of the parent/reply.
 * @param {object} linksDiv      - Container for all parent/reply links of the current comment.
 */
function addLink(parents, text, commentIndent, linkNum, linkId, linksDiv) {
	// Hoverable link to parent/reply
	var tooltip = document.createElement('div');
	tooltip.innerText = String(linkNum);
    tooltip.classList.add('hnp-tooltip');
	tooltip.addEventListener('click', function(event) {
		// Fire only for the link, not the hover text
		if (event.target !== this) {
			return;
		}
		goToComment(linkId);
	});

	// Text box with the content of the parent/reply
	var hoverText = document.createElement('div');
	hoverText.classList.add('hnp-tooltiptext');
	hoverText.innerText = text;
	
	// Set some initial styling (might be overwritten later)
	hoverText.style.width = String(hoverTextW) + 'px';
	// Manually set left offset
	if (parents) {
		hoverText.style.left = String(-100 - 40 * (commentIndent / 40 - 1)) + 'px';
	} else {
		hoverText.style.left = String(-98 - 40 * (commentIndent / 40 - 1)) + 'px';
	}
	tooltip.appendChild(hoverText);

	// Parent and reply links come in different order
	// 0xa0 is a nonbreakable space
	if (parents) {
		linksDiv.insertBefore(tooltip, linksDiv.firstChild); // Add link in the first place since the parent comments are trasevered upward
		linksDiv.insertBefore(document.createTextNode('\xa0'), linksDiv.firstChild);
	} else {
		linksDiv.appendChild(tooltip);
		linksDiv.appendChild(document.createTextNode('\xa0'));
	}

}

/**
 * Go to comment with id commentId.
 * 
 * @param {string} commentId - Id of a comment.
 */
function goToComment(commentId) {
	window.location.hash = commentId;
}

/**
 * Set left offset for the hover text of all parent/reply links in the current comment.
 * All hover text will be in the same horizontal position.
 * 
 * @param {string} linksDivClass - Name of the class given to the links container. 
 * @param {number} currentIdx    - Index of current comment.
 */
function adjustLeftOffset(linksDivClass, currentIdx) {
	var links = allComments[currentIdx].getElementsByClassName(linksDivClass)[0].children;
	var firstLeftOffset = links[0].offsetLeft;
	var leftOffset;

	for (var i = 1; i < links.length; i++) {
		leftOffset = links[i].offsetLeft - firstLeftOffset;
		leftOffset = parseFloat(links[i].children[0].style.left.slice(0, -2)) - leftOffset;
		links[i].children[0].style.left = String(leftOffset) + 'px';
	}
}

/**
 * Add a listener to hide/show added links on comments collapse.
 * 
 * @param {number} currentIdx - Index of a comment in the global array of comments.
 */
function toggleOnCollapse(currentIdx) {
	allComments[currentIdx].querySelector('.togg').addEventListener('click', function(event) {
		var currentComment = event.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
		var links = currentComment.querySelectorAll('.hnp-links-container');
		if (currentComment.classList.contains('coll')) {
			links[0].style.display = 'none';
			links[1].style.display = 'none';
		} else {
			links[0].style.display = 'block';
			links[1].style.display = 'block';
		}
	});
}


var hoverTextW = document.getElementById('hnmain').offsetWidth - 40;
var allComments = document.querySelectorAll('TABLE.comment-tree > TBODY > TR.comtr');
var totalComments = allComments.length;
var currentIndent, parentIndent, replyIndent;

for (var i = 0; i < totalComments; i++) {
	currentIndent = allComments[i].querySelector('TR > TD > TABLE > TBODY > TR > TD.ind > img').width;  // Get indent value (equals comment depth/level in thread)
	parentIndent = currentIndent - 40;
	replyIndent = currentIndent + 40;
	addParents(i, currentIndent, parentIndent);
	addReplies(i, currentIndent, replyIndent);
	toggleOnCollapse(i);
}