'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var $form = $('form').submit(function(e) {
    e.preventDefault();
    console.info('submitting form');
    window.close();
  });

  var $url = $('input [name="url"]').val(window.location.toString());
  
});