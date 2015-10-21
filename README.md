examplejs
---------

> Generate highlight blocks from runtime browser samples


Include examplejs dependencies. Optionally include a theme stylesheet.

```html
<script src="js/example.js"></script>
<link rel="stylesheet" href="css/bootstrap.css"/>
```

Optionaly require highlightjs for syntax highlighting:

```html
<link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.8.0/styles/github.min.css">
<script src="http://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.8.0/highlight.min.js"></script>    
```

Use DOM Annotations to highlight your code as an example.


```html
<h2>Example: Hello World!</h2>
<p>This example requires jQuery</p>

<!-- @example -->
<script src="http://code.jquery.com/jquery-1.11.2.min.js"></script>

<p>Provide markup, styles and Javascript</p>
<!-- @example !-->
<h3 id="test">Hello World!</h3>
<p>Welcome to the Jungle!</p>
<!--/-->

<p>Provide styles</p>
<!-- @example -->
<style>
   .highlighted {
     color: teal;
   }
</style>

<p>Provide Javascript</p>
<!-- @example -->
<script>
  $('#test').addClass('highlighted');
</script>
```

### DOM Annotation Specs

* Single comments target the next significant sibling: `<!-- ... --> <elem> `
* Block comments can be defined by the pattern `<!-- ... !--> <elem> <elem> <!--/ ... -->`
* Comments can contain certain tags, designated by a leading `@` which can have attributes assigned by the pattern `var1=34 var2='string'`.

