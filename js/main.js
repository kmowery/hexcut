
(function($) {
  //$.widget("ui.bitdialog", $.ui.dialog, {
  $.widget("ui.bits", {
    _create: function() {
      var self = $(this);
      var widget = this;
      var element = $(this.element);

      this.n = 0;
      this.clicked = null;

      element.addClass("bits");
      this.numberfield = $('<input type="text">').val("0x").addClass("ui-widget");
      this.numberfield.bind( 'input', function(event) {
        widget.n = properParseInt(widget.numberfield.val());
        widget.handleNumber();
      });
      element.append(this.numberfield)

      this.bits = [];
      for(var i = 31; i >= 0; i--) {
        this.bits[i] = $('<span>').addClass("bit").click(function(loc) {
          return function(event) {
            widget.handleClick(loc);
          }
        }(i));
        element.append(this.bits[i])
      }

      // Make the functions
      this.handleNumber = function() {
        if(isNaN(this.n)) {
          for( var i = 0; i < 32; i++ ) {
            this.bits[i].text('-');
          }
        } else {
          var bit;
          for( var i = 0; i < 32; i++ ) {
            bit = this.n >> i & 0x1;
            this.bits[i].text(bit);
          }
        }
      }
      this.handleClick = function(loc) {
        if(this.clicked == null) {
          this.clicked = loc;
          this.bits[loc].addClass("bitselected");
        } else {
          if( loc != this.clicked ) {
            alert("build a bridge between " + loc + " and " + this.clicked);
          }
          this.bits[this.clicked].removeClass("bitselected");
          this.clicked = null;
        }
      }

      this.handleNumber();
    }

  });
})(jQuery);

// JavaScript's parseInt is terrible. parseInt('0xNOTANUMBER') returns 0.
// Fix it.
properParseInt = function(str) {
  var i = 0;
  var base = 10;
  var n = 0;

  if(str.length >= 2 && str.substring(0,2) == '0x') {
    console.log("hex")
    base = 16;
    i = 2;
  } else if(str.length >= 1 && str.substring(0,1) == '0') {
    base = 8;
    i = 1;
  }

  for( ; i < str.length; i++ ) {
    n = n * base + parseInt(str[i], base);
  }

  return n;
}

$(document).ready(function() {
  $("#hook").bits();
});

