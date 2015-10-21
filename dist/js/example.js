(function() {

  var
    
    /**
     * DOM Annotation Parser
     */
    domnotes = (function(doc) {
      
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
        },
      
        /**
         * Merge defaults with user options
         * @private
         * @param {Object} defaults Default settings
         * @param {Object} options User options
         * @returns {Object} Merged values of defaults and options
         */
        
        extend = function ( defaults, options ) {
            var
              extended = {},
              prop;
            for (prop in defaults) {
              if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                  extended[prop] = defaults[prop];
              }
            }
            for (prop in options) {
              if (Object.prototype.hasOwnProperty.call(options, prop)) {
                  extended[prop] = options[prop];
              }
            }
            return extended;
        },

        /**
         * Access original source data
         */
        getSource = (function(doc) {
          var
            cache = [],
            clonedDocument = doc.cloneNode(),
            get = function(node) {
              // Get source from cache
              var
                result = cache.filter(function(item) {
                  return item.node === node;
                })[0];
              return result;
            },
            add = function(node) {
              // Add node to cache if not exists
              var
                item = get(node),
                data = node.outerHTML || node.nodeType === 3 && node.textContent,
                parent = get(node.parentNode),
                clone;
              if (!item) {
                clone = node.cloneNode();
                cache.push({node: node, clone: clone, data: data});
              } else {
                clone = item.clone;
              }
              if (parent) {
                parent.clone.appendChild(clone);
              }
              
            },
            // Observe node insertions while the document is being processed
            observe = (function(doc, callback) {
              var
                MutationObserver = window.MutationObserver;
              if (MutationObserver) {
                // W3C Mutation Observer
                (new MutationObserver(function (mutations) {
                  if (document.readyState !== 'loading') {
                    //return;
                  }
                  mutations.forEach(function (mutation) {
                    toArray(mutation.addedNodes).forEach(function(addedNode) {
                      callback(addedNode);
                    });
                  });
                })).observe(doc, {
                  childList: true,
                  subtree : true,
                  attributes: true, 
                  characterData : true
                });
              } else {
                // TODO: Fallback
              }
            })(document, add);
          
          function getData(node) {
            return node.outerHTML || node.nodeType === 3 && node.data || node.nodeType === 8 && "<!--" + node.data + "-->" || "";
          }
          
          return function(node) {
            var
              cachedItem = cache.filter(function(item) {
                return item.node === node;
              })[0];
            if (cachedItem) {
              return getData(cachedItem.clone);
            }
            return getData(node);
          };
            
        })(document),
        
        
        /**
         * Parse DOM Annotations 
         * @param {Object} source
         */
        parseAnnotations = function(source) {
          
          source = source || document;
          
          var
            result = [],
            current = null,
            open = [],
            i, c, o, node, 
            tagPattern = /\s*@(\w*)(?:\s+([^\n]*(?:\n|$)))?/g, 
            tagMatch, tagName, tagValue, 
            attrPattern = /(\w*)=(?:\s*['"]([^'"]*)['"]|([^\s]*))/g,
            attrMatch, attributes, attrName, attrValue,
            isBlock,
            blockOpenPattern = /\!$/gi,
            blockClosePattern = /^\//gi,
            closed = false;
          
          for (i = 0; i < source.childNodes.length; i++) {
            
            node = source.childNodes[i];
            
            
            
            // Add node to parents
            for (o = 0; o < open.length; o++) {
              if (!open[o].closed && open[o] !== current) {
                open[o].context.contents.push(node);
                open[o].context.data+= getSource(node);
              }
            }
            
            // Add node to current
            if (current && !current.closed && current.node !== node && (node.nodeType !== 8 || !node.data.match(blockClosePattern))) {
              current.context.contents.push(node);
              current.context.data+= getSource(node);
            }
            
            // Check for new comment
            if (node.nodeType === 8 && trim(node.data).length > 0 && !node.data.match(blockClosePattern)) {

              isBlock = false;
              if (node.data.match(blockOpenPattern)) {
                // Open block
                isBlock = true;
              }
              // Create annotation
              current = {node: node, tags: {}, context: {contents: [], data: ""}, closed: closed, mustClose: null, isBlock: isBlock};
              // Parse tags
              do {
                tagMatch = tagPattern.exec(node.data);
                if (tagMatch) {
                  tagName = tagMatch[1];
                  tagValue = tagMatch[2];
                  // Parse tag attributes
                  attributes = {};
                  do {
                    attrMatch = attrPattern.exec(tagValue);
                    if (attrMatch) {
                      attrName = attrMatch[1];
                      attrValue = attrMatch[2] || attrMatch[3];
                      attributes[attrName] = attrValue;
                    }
                  } while (attrMatch);
                  // Merge tag attributes
                  current.tags[tagName] = extend(current.tags[tagName], {name: tagName, value: tagValue, attributes: attributes});
                }
              } while (tagMatch);
              current.level = open.length;
              result.push(current);
              if (isBlock) {
                open.push(current);
              }
            }
            
            // Detect significant node and close
            if (current && !current.isBlock && node !== current.node && (node.nodeType === 1 || trim(node.data).length) && (node.nodeType !== 8 || !node.data.match(blockClosePattern))) {
              current.context.node = node;
              current.closed = true;
            }
            
            // Detect block close
            if (current && node.nodeType === 8 && node.data.match(blockClosePattern)) {
              current.closed = true;
              current = open.pop();
            }
            
            // Recursive 
            if (node.nodeType === 1) {
              try {
                result = result.concat(parseAnnotations(node));
              } catch(e) {
                console.log(e);
              }
            }
            
            
          }
          
          
          return result;
        };
      
      return function (source) {
        return parseAnnotations(source);
      };
      
    })(document),
    
    
    trim = function(string) {
      string = string.match(/\S+/g);
      return string ? string.join(' ') : '';
    }, 

    
    /**
     * Prettify code by fixing indentation
     * @param {Object} string
     */
    pretty = function(string) {
      string = string.replace(/^\s*\n/, "");
      string = string.replace(/(\s+$)/, '');
      var
        lines = string.split("\n"),
        indent = 0,
        i = 0,
        line,
        getIndent = function(string) {
          // Get leading whitespace count
          var
            result = 0, characterCode = string.charCodeAt(0);
          while (32 === characterCode || characterCode > 8 && characterCode < 14 && characterCode !== 11 && characterCode !== 12) {
            characterCode = string.charCodeAt(++result);
          }
          return result;
        };
      for (i = 0; line = lines[i]; i++) {
        indent = getIndent(line);
        if (indent > 0) {
          if (i > 0) {
            indent-= 2;
          }
          break;
        }
      }
      for (i = 0; line = lines[i]; i++) {
        if (i === 0 || i === lines.length - 1) {
          lines[i] = line.replace(/^\s+/, '');
        } else {
          lines[i] = line.replace(new RegExp("^\\s{" + indent + "}"), "");
        }
      }
      string = lines.join("\n");
      return string;
    },
    
    
    /**
     * Highlights code using Highlight.js if available
     * @param {Object} lang
     * @param {Object} code
     */
    highlight = function(lang, code) {
      var
        hljs = window.hljs,
        pre;
      // Highlight.js
      if (hljs) {
        try {
          return hljs.highlight(lang, code).value;
        } catch(e) {
        }
      }
      // Escape html
      pre = document.createElement('pre');
      pre.appendChild(document.createTextNode(code));
      return pre.innerHTML;
    },
    
    
    /**
     * Executes callback when dom content is loaded
     * @param {Object} callback
     * 
     * http://javascript.ru/unsorted/top-10-functions
     */
    ready = function(callback) {
      var
        called = false,
        tryScroll = function(){
          if (called || !document.body) {
            return;
          }
          try {
            document.documentElement.doScroll("left");
            ready();
          } catch(e) {
            setTimeout(tryScroll, 0);
          }
        },
        ready = function() {
          if (called) {
            return;
          }
          called = true;
          callback();
        };
      if ( document.addEventListener ) {
        document.addEventListener( "DOMContentLoaded", function() {
          ready();
        }, false );
      } else if ( document.attachEvent ) { 
        if ( document.documentElement.doScroll && window === window.top ) {
          tryScroll();
        }
        document.attachEvent("onreadystatechange", function(){     
          if ( document.readyState === "complete" ) {
            ready();
          }
        });
      }
      if (window.addEventListener) {
        window.addEventListener('load', ready, false);
      } else if (window.attachEvent) {
        window.attachEvent('onload', ready);
      } else {
        // use this 'else' statement for very old browsers :)
        window.onload = ready;
      }
    },
    
    /**
     * Example Object
     */
    Example = {
      
      /**
       * Run examplejs
       */
      run: function() {
        var
          annotations = domnotes(),
          examples = annotations.filter(function(annotation) {
            return annotation.tags.example;
          });
          
        examples.forEach(function(annotation) {
          
          var
            tag = annotation.tags.example,
            contents = annotation.context.contents,
            node = annotation.node,
            lang = tag.attributes.lang || (function(contents) {
              // Detect lang
              var
                langs = contents.map(function(child) {
                  return child.tagName === 'SCRIPT' && !child.getAttribute('src') ? 'js' : child.tagName === 'STYLE' ? 'css' : child.nodeType === 3 && trim(child.nodeValue || child.nodeType === 1) ? 'html' : null;
                }).filter(function(lang, index, self) {
                  return lang && self.indexOf(lang) === index;
                });
              return langs.length === 1 ? langs[0] : 'html';
            })(contents) || "html",
            
            markup,
            wrapper = document.createElement('div'),
            pre = document.createElement('pre'),
            
            fragment,
            
            code = lang === 'html' ? annotation.context.data : annotation.context.contents.filter(function(node) {
              return lang === 'js' ? node.tagName === 'SCRIPT' : lang === 'css' ? node.tagName === 'STYLE' : false; 
            }).map(function(node) {
              return node.innerHTML;
            }).join(""),
            
            formatted = pretty(code),
            
            html = highlight(lang, formatted),
            
            visible = lang === 'html' && contents.filter(function(node) {
              return (node.nodeType === 1 && !node.tagName.match(/SCRIPT|STYLE|LINK|META|HEAD/) || node.nodeType === 3 && trim(node.data).length);
            }).length > 0;
          
          
          
          pre.innerHTML = html;
          
          wrapper.setAttribute('class', 'highlight');
          wrapper.appendChild(pre);
          
          node.parentNode.insertBefore(wrapper, node.nextSibling);
          
          if (lang === 'html' && visible) {
            // Create a wrapper for runtime sample markup
            fragment = (function(nodes) {
              var
                result = document.createDocumentFragment();
              nodes.forEach(function(node) {
                result.appendChild(node);
              });
              return result;
            })(contents);
            markup = document.createElement('div');
            markup.setAttribute('class', 'highlight-example');
            markup.appendChild(fragment);
            node.parentNode.insertBefore(markup, node.nextSibling);
          }
    
        });
        
      }
    };

  ready(function() {
    Example.run();
  });
  
})();