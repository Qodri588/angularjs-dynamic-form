(function (angular, document) {

     var module = angular.module('dynamic-form', ['ng']);

     module.directive(
         'dynamicTableForm',
         ['$compile', '$parse', function ($compile, $parse) {
              return {
                  restrict: 'EA',
                  priority: 1000,
                  terminal: true,
                  scope: {
                      fieldsExpr: '&fields',
                      dataExpr: '&data'
                  },
                  compile: function (element, attr, linker) {
                      return function ($scope, $element, $attr) {

                          var typeTemplates = {};

                          angular.forEach(
                              $element.children(),
                              function (childElem) {

                                  if (! childElem.getAttribute('dynamic-field-type')) {
                                      return;
                                  }

                                  childElem = angular.element(childElem);

                                  var typeName = childElem.attr('dynamic-field-type');
                                  typeTemplates[typeName] = childElem;

                              }
                          );

                          $element.html('');

                          var tableElem = angular.element('<table></table>');
                          // FIXME: I bet this doesn't work in some browsers (I'm looking at you,
                          // old versions of MSIE) because they'll implicitly create a TBODY in
                          // here and then refuse to display rows that aren't in it.

                          function linkFunctionForFieldType(type) {
                              var match = type.match(/^(\w+)\<.*\>$/);
                              if (match) {
                                  // it's a collection type.
                                  // TODO: implement collection types.
                                  return function () {};
                              }
                              else {
                                  var template = typeTemplates[type];
                                  if (template) {
                                      return $compile(template);
                                  }
                                  else {
                                      // unknown type, so no-op.
                                      return function () {};
                                  }
                              }
                          }

                          function buildRows(fields, oldFields) {
                              if (fields === oldFields) {
                                  return;
                              }

                              // FIXME: Need to remember what scopes we created here so that
                              // if we get run again we can destroy them all before we make
                              // new ones.

                              // empty the table in case we've already got some stuff in there
                              tableElem.html('');

                              var data = $scope.dataExpr($scope);

                              angular.forEach(
                                  fields,
                                  function (field) {

                                      // We need to create the table elements via the DOM API
                                      // because parsing individual table sub-elements outside
                                      // of the context of a table does silly things.
                                      var rowElem = angular.element(
                                          document.createElement('tr')
                                      );
                                      var captionElem = angular.element(
                                          document.createElement('th')
                                      );
                                      var bodyElem = angular.element(
                                          document.createElement('td')
                                      );
                                      rowElem.append(captionElem);
                                      rowElem.append(bodyElem);

                                      function updateCaption(newCaption) {
                                          captionElem.text(field.caption);
                                      }

                                      function updateFieldType(newType) {
                                          bodyElem.html('');
                                          var fieldScope = $scope.$new(true);
                                          fieldScope.config = field;

                                          var modelGet = $parse(field.model);
                                          var modelSet = modelGet.assign;

                                          var lastValue = fieldScope.value = modelGet(data);

                                          // make fieldScope.value an alias of the model
                                          $scope.$watch(
                                              function () {
                                                  var parentValue = modelGet(data);
                                                  if (parentValue !== fieldScope.value) {
                                                      // out of sync and need to copy
                                                      if (parentValue !== lastValue) {
                                                          // parent changed and has precedence
                                                          lastValue = fieldScope.value = parentValue;
                                                      }
                                                      else {
                                                          // update the parent
                                                          parentValue = lastValue = fieldScope.value;
                                                          modelSet(
                                                              data,
                                                              fieldScope.value
                                                          );
                                                      }
                                                  }
                                                  return parentValue;
                                              }
                                          );
                                          var link = linkFunctionForFieldType(field.type);
                                          link(
                                              fieldScope,
                                              function (clonedElement) {
                                                  bodyElem.append(clonedElement);
                                              }
                                          );
                                      }

                                      $scope.$watch(
                                          function () {
                                              return field.caption;
                                          },
                                          updateCaption
                                      );

                                      $scope.$watch(
                                          function () {
                                              return field.type;
                                          },
                                          updateFieldType
                                      );

                                      tableElem.append(rowElem);
                                  }
                              );
                          }

                          $scope.$watch(
                              function () {
                                  return $scope.fieldsExpr($scope);
                              },
                              buildRows,
                              true
                          );
                          $scope.$watch(
                              function () {
                                  return $scope.dataExpr($scope);
                              },
                              function () {
                                  buildRows($scope.fieldsExpr($scope));
                              },
                              false
                          );

                          $element.append(tableElem);

                      };
                  }
              };
         }]
     );

})(angular, document);
