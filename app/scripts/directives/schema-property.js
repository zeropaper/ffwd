(function() {
  'use strict';
  angular.module('schema', [])
  .directive('schemaPropertyField', function() {
    console.info('schemaPropertyField', arguments, this);
    return {
      scope: {
        definition: '=definition',
        values: '=values'
      },
      templateUrl: 'partials/schema-property-field.html'
      // template: 'Name: {{customer.name}} Address: {{customer.address}}'
    };
  });
}());