// do this in JS so that we do not modify bootstrap and we keep markdown readable without Jekyll
$(function(){
    'use strict';
    $('table:not([class])').addClass('table table-striped table-bordered')
  });
