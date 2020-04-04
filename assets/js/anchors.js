$(function(){
    'use strict';
    $(':header[id]').each(function() {
      var $this = $(this);
      if(!/^h[2-6]$/i.test($this.prop('nodeName'))) return;
      $this.prepend('<a class="auto-anchor text-light" href="#' + $this.attr('id') + '"><i class="fas fa-link"></i></a>')
    });
  });
