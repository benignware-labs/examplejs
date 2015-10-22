(function(doc) {
  
  var
    /**
     * Trims whitespace from a string
     */
    trim = function(string) {
      string = string.match(/\S+/g);
      return string ? string.join(' ') : '';
    }, 

    /**
     * Converts native list objects to arrays
     * @param {Array} array
     */
    toArray = function(array) {
      return Array.prototype.slice.call(array);
    };
            
            
            var current = null;
  var documentObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        //console.log("mutation: ", mutation);
        toArray(mutation.addedNodes).forEach(function(node) {
          console.info("node added: ", node, mutation.target, "children: ", node.childNodes.length, " -> ", node.outerHTML || node.data);
          
          
          if (node.tagName === 'SCRIPT') {
            console.log("LOAD SCRIPT");
            node.onload = function() {
              console.log("SCRIPT LOADED: ", this.src);
            };
            node.onreadystatechange= function () {
              console.log("READY STATE: ", this.readyState);
            };
          }
          
          if (node.nodeType === 8) {
            var commentNode = node;
            console.log('Comment added: ', commentNode, commentNode.parentNode);
            current = {
              node: node,
              context: null
            };
          }
          
          if (node.previousSibling && (node.nodeType === 1 || node.nodeType === 3)) {
            var sibling = node, significant = 0, contents = [], c = 0;
            while ( sibling = sibling.previousSibling ) {
              if (significant > 2) {
                break;
              }
              if (significant === 1 && sibling.nodeType === 8) {
                console.warn("RELATED COMMENT: ", sibling, contents.map(function(node) { return node.outerHTML || node.data; }).join(""));
                break;
              }
              if (sibling.nodeType === 1 || sibling.nodeType === 3 && trim(sibling.data)) {
                significant++;
              }
              contents.push(sibling);
            }
          }
        });
      });
  });
  
  documentObserver.observe(doc, {
    childList: true,
    subtree : true,
    attributes: true, 
    characterData : true
  });
  
  
  
  
})(document);
