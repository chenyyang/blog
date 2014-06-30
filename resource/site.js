
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-26417569-1']);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


// Persnikity Pygmentize

var MetaPygmentize = {
  
  process: function() {
    this.convert('nb', 'n',   ['id','name']);
    this.convert('nb', 'c1',  ['self']);
    this.convert('n',  'nb',  ['new']);
    this.convert('o',  'k',   ['*','&','+','/','=']);
    this.convert('nx', 'k',   ['$','$$']);
    this.convert('k',  'kjs', ['this']);
    this.convert('kp', 'sr',  ['public','private','protected']);
  },
  
  arrayInclude: function(array, obj) {
    var i = array.length;
    while (i--) {
      if (array[i] === obj) { return true; }
    }
    return false;
  },
  
  convert: function(fromClass, toClass, texts) {
    var spans = $('div.highlight span.' + fromClass);
    spans.each(function(i,s){
      var span = $(s);
      var text = span.text();
      var target = MetaPygmentize.arrayInclude(texts,text);
      if (target) { span.attr('class',toClass); };
    });
  }
  
}

// My Namespace

var MetaSkills = {
  
  appendContentForAppleTvNavigation: function() {
    $('#page nav a').append('<span></span>');
  },
  
  hideSeoContent: function() {
    $('#badge_js').html('');
    $('#badge_js').text('');
  }
  
};


// Document Loads

$(document).ready(function(){
  MetaSkills.appendContentForAppleTvNavigation();
  MetaSkills.hideSeoContent();
  MetaPygmentize.process();
})



