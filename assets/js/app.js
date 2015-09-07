"use strict";

/* App Module */
var ngBookApp = angular.module('ngBookApp', [
    'ui.router',
    'bcBookService',
    'bcBookReviewService'
]);


/* Simple router to our pages. If page is not found, return error page */
ngBookApp.config(['$httpProvider', '$stateProvider', '$locationProvider',
    function($httpProvider, $stateProvider, $locationProvider) {
        // use the HTML5 History API
        $locationProvider.html5Mode(true);

        $stateProvider
            .state('landing', {
                url: "/",
                templateUrl: "templates/landing.html",
            })
            .state('bookAdd', {
                url: "/book",
                controller: "BookAddController",
                templateUrl: 'templates/bookaddform.html',
            })
            .state('bookReview', {
                url: "/book/review/:bookId",
                controller: "BookReviewController",
                templateUrl: 'templates/bookreviewform.html',
            })
            .state('bookdetails', {
                url: "/book/:bookId",
                controller: "BookDetailsController",
                templateUrl: 'templates/bookdetails.html'
            })
            .state('notFound', {
                url: '{path:.*}',
                templateUrl: 'templates/error.html',
            });
    }
]);

/* Controller for general page items */
ngBookApp.controller('mainController', ['$scope', 'bcBookService',
    function($scope, bcBookService){
        /* Call service to get books */
        bcBookService.getAllBooks().then(function(bookList) {
            $scope.bookList = bookList;
        });

        /* Toggle menu in mobile nav */
        $scope.isActive = false
        $scope.toggleMenu = function() {
            $scope.isActive = !$scope.isActive;
        }

        /* Call when menu item is clicked. Closes menu and can potentially track user actions  */
        $scope.menuItemClicked = function() {
            $scope.isActive = !$scope.isActive;
        }

        /* Toggle Welcome Box */
        $scope.welcomeBoxHidden = false;
        $scope.hideWelcomeBox = function() {
            $scope.welcomeBoxHidden = !$scope.welcomeBoxHidden;            
        }
    }
]);


/* Controller for book details page */
ngBookApp.controller('BookReviewController', ['$scope', 'bcBookService', 'bcBookReviewService', '$stateParams', '$state',
    function($scope, bcBookService, bcBookReviewService, $stateParams, $state) {
        //Call to load up seed data, 
        //This call wouldnt exist in prod, only for our simulation 
        var addReview = function() {
            bcBookReviewService.populateFakeData().then(function(bookList) {
                $scope.addReview = function() {
                    $scope.review['rating'] = $scope.rating;
                    bcBookReviewService.submitReview($scope.review, $stateParams.bookId).then(
                        function(response) {
                            alert('Thank you for submitting your review');
                            $state.go("landing");
                        },
                        function() {
                            alert('Error, please try again later');
                        });
                };
            });
        }

        var errorReview = function() {
            $state.go('landing');
        }

        //check if book exists
        bcBookService.getBookDetailsById($stateParams.bookId).then(addReview, errorReview);
    }
]);

/* Controller for book adding form */
ngBookApp.controller('BookAddController', ['$scope', 'bcBookService', '$state',
    function($scope, bcBookService, $state) {
        $scope.addBook = function(bookData) {
            bcBookService.submitBookEntry(bookData).then(
                function() {
                    alert('Thank you for submitting Book!');
                    $state.go("landing");
                },
                function() {
                    alert('Book title has already been added!');
                });
        }
    }
]);

/* Controller for book adding form */
ngBookApp.controller('BookDetailsController', ['$scope', 'bcBookService', 'bcBookReviewService', '$state', '$stateParams',
    function($scope, bcBookService, bcBookReviewService, $state, $stateParams) {

        //callback for getting reviews
        var getReviews = function(bookList) {
            //Current book info, in case we wanted to show picture, title etc
            $scope.bookList = bookList;

            //Simulate getting data from backend. 
            //Need to call populate fake data to prepopulate seed data
            bcBookReviewService.populateFakeData().then(function() {
                bcBookReviewService.getAllReviewsId($stateParams.bookId).then(
                    function(data) {
                        $scope.bookDetails = data;
                    });
            });
        }

        //oops, error. Redirect to landing.
        var errorReview = function() {
            $state.go('landing');
        }

        //check if book exists
        bcBookService.getBookDetailsById($stateParams.bookId).then(getReviews, errorReview);

        $scope.sortKeyValues = { 1 : "Rating", 2: "Title" };

        /*Sort function on details page */
        $scope.sortBookDetails = function() {
            var sortKey = $scope.sortBy;

            //Sort by rating 
            if (sortKey == 1) {
                var sortedButtons = $scope.bookDetails.sort(function(keyA, keyB) {
                    return keyB.rating - keyA.rating
                });
            }

            //Sort by title 
            if (sortKey == 2) {
                var sortedButtons = $scope.bookDetails.sort(function(keyA, keyB) {
                    return (keyB.title.toLowerCase() > keyA.title.toLowerCase()) ? -1 : 1;
                });
            }

        };
    }
]);


/* Filter to sort our custom objects */
ngBookApp.filter('orderObjectBy', function() {
    return function(input, attribute) {
        if (!angular.isObject(input)) return input;

        var returnArray = {};
        var keysSorted = [];
        //create copy of input
        var tmp_input = (JSON.parse(JSON.stringify(input)));

        //sort by key
        keysSorted = Object.keys(tmp_input).sort(function(a, b) {
            return a > b
        });

        //create new sorted array
        for (var key in keysSorted) {
            returnArray[keysSorted[key]] = input[keysSorted[key]];
        }

        return returnArray;
    }
});

//Directive for Review Stars
ngBookApp.directive('starRating',
    function() {
        return {
            //This template is used to display the star UX in repeted form.
            templateUrl: "templates/stars.html",
            scope: {
                ratingValue: '=',
                max: '='
            },
            link: function(scope, elem, attrs) {
                var updateRating = function() {
                    scope.stars = [];

                    //Loop called with the help of data-max directive input and push the stars count.
                    for (var i = 0; i < scope.max; i++) {
                        scope.stars.push({
                            filled: i < scope.ratingValue
                        });
                    }
                };

                //This is used to toggle the rating stars.
                scope.toggleStar = function(index) {
                    //This is used to count the default start rating and sum the number of imput index.
                    scope.ratingValue = index + 1;
                };

                //Watcher to see if stars change.
                scope.$watch('ratingValue',
                    function(previousValue, newValue) {
                       if (newValue) {
                            updateRating();
                        }
                    }
                );
            }
        };
    }
);
