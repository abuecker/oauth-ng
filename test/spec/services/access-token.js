'use strict';

angular.module('html5Mode', [])
  .config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  }]);

// test once in html5mode and once in hashbang mode
[true, false].forEach(function (html5mode) {

  describe('(html5mode=' + html5mode + ')', function () {

    describe('AccessToken', function() {

      var result, $location, $sessionStorage, AccessToken, date;

      var fragment = 'access_token=token&token_type=bearer&expires_in=7200&state=/path&extra=stuff';
      var denied   = 'error=access_denied&error_description=error';
      var expires_at = '2014-08-17T17:38:37.584Z';
      var token    = { access_token: 'token', token_type: 'bearer', expires_in: 7200, state: '/path', expires_at: expires_at };

      beforeEach(module('oauth'));

      // set the location provider to use html5mode
      if (html5mode) {
        beforeEach(module('html5Mode'));
      }


      beforeEach(inject(function($injector) { $location       = $injector.get('$location') }));
      beforeEach(inject(function($injector) { $sessionStorage = $injector.get('$sessionStorage') }));
      beforeEach(inject(function($injector) { AccessToken     = $injector.get('AccessToken') }));


      describe('#set', function() {

        describe('when sets the access token', function() {

          beforeEach(function() {
            if (html5mode) {
              $location.hash(fragment);
            } else {
              $location.path(fragment);
              $location.replace();
            }
          });

          beforeEach(function() {
            result = AccessToken.set();
          });

          it('sets the access token', function() {
            expect(result.access_token).toEqual('token');
          });

          it('sets #expires_at', function() {
            var expected_date = new Date();
            expected_date.setSeconds(expected_date.getSeconds() + 7200 - 60);
            expect(parseInt(result.expires_at/100)).toBe(parseInt(expected_date/100)); // 10 ms
          });
        });

        describe('with the access token in the fragment URI', function() {

          beforeEach(function() {
            if (html5mode) {
              $location.hash(fragment);
            } else {
              $location.path(fragment);
              $location.replace();
            }
          });

          beforeEach(function() {
            result = AccessToken.set();
          });

          it('sets the access token', function() {
            expect(result.access_token).toEqual('token');
          });

          it('removes the fragment string', function() {
            if (html5mode) {
              expect($location.hash()).toEqual('extra=stuff');
            } else {
              expect($location.path()).toEqual('/');
            }
          });

          it('stores the token in the session', function() {
            var stored_token = $sessionStorage.token;
            expect(result.access_token).toEqual('token');
          });
        });

        describe('with the access token stored in the session', function() {

          beforeEach(function() {
            $sessionStorage.token = token;
          });

          beforeEach(function() {
            result = AccessToken.set();
          });

          it('sets the access token from session', function() {
            expect(result.access_token).toEqual('token');
          });
        });

        describe('with the denied message in the fragment URI', function() {

          beforeEach(function() {
            if (html5mode) {
              $location.hash(denied);
            } else {
              $location.path(denied);
              $location.replace();
            }
          });

          beforeEach(function() {
            result = AccessToken.set();
          });

          it('sets the access token', function() {
            expect(result.error).toEqual('access_denied');
          });

          it('removes the fragment string', function() {
            if (html5mode) {
              expect($location.hash()).toBe('');
            } else {
              expect($location.path()).toBe('/');
            }
          });

          it('stores the error message in the session', function() {
            var stored_token = $sessionStorage.token;
            expect(result.error).toBe('access_denied');
          });
        });
      });

      describe('#get', function() {

        beforeEach(function() {
          if (html5mode) {
            $location.hash(fragment);
          } else {
            $location.path(fragment);
            $location.replace();
          }
        });

        beforeEach(function() {
          AccessToken.set();
        });

        beforeEach(function() {
          result = AccessToken.get();
        });

        it('sets the access token', function() {
          expect(result.access_token).toEqual('token');
        });
      });


      describe('#destroy', function() {

        beforeEach(function() {
          if (html5mode) {
            $location.hash(fragment);
          } else {
            $location.path(fragment);
            $location.replace();
          }
        });

        beforeEach(function() {
          AccessToken.set();
        });

        beforeEach(function() {
          result = AccessToken.destroy();
        });

        it('sets the access token', function() {
          expect(result).toBeNull();
        });

        it('reset the cache', function() {
          expect($sessionStorage.token).toBeUndefined;
        });
      });


      describe('#expired', function() {

        beforeEach(function() {
          if (html5mode) {
            $location.hash(fragment);
          } else {
            $location.path(fragment);
            $location.replace();
          }
        });

        beforeEach(function() {
          AccessToken.set();
        });

        describe('when not expired', function() {

          beforeEach(function() {
            result = AccessToken.expired();
          });

          it('returns false', function() {
            expect(result).toBe(false);
          });
        });

        describe('when expired', function() {

          beforeEach(function() {
            date = new Date();
            date.setTime(date.getTime() + 86400000);
          });

          beforeEach(function() {
            Timecop.install();
            Timecop.travel(date); // go to the future (one day)
          });

          beforeEach(function() {
            result = AccessToken.expired();
          });

          afterEach(function() {
            Timecop.uninstall();
          });

          it('returns true', function() {
            expect(result).toBe(true);
          });
        });
      });

      describe('#sessionExpired', function() {
          describe('with the access token stored in the session', function() {

              beforeEach(function() {
                  //It is an invalid test to have oAuth hash AND be getting token from session
                  //if hash is in URL it should always be used, cuz its coming from oAuth2 provider re-direct
                  if (html5mode) {
                    $location.hash('');
                  } else {
                    $location.path('/');
                    $location.replace();
                  }
                  $sessionStorage.token = token;
                  result = AccessToken.set().expires_at;
              });

              it('rehydrates the expires_at value', function() {
                  expect(result).toEqual(new Date(expires_at));
              });
          });
      });

    }); // ---

  });

});
