const express = require('express');
const router = express.Router();
const {FusionAuthClient} = require('@fusionauth/typescript-client');

// tag::clientIdSecret[]
// set in the environment or directly
const clientId = process.env.CLIENT_ID; // or set directly
const clientSecret = process.env.CLIENT_SECRET; // or set directly
// end::clientIdSecret[]

// tag::baseURL[]
const fusionAuthURL = process.env.BASE_URL;
// end::baseURL[]

const client = new FusionAuthClient('noapikeyneeded', fusionAuthURL);
const pkceChallenge = require('pkce-challenge');

// tag::logoutRoute[]
/* logout page. */
router.get('/logout', function (req, res, next) {
  req.session.destroy();
  res.redirect(302, '/');
});
// end::logoutRoute[]

/* GET home page. */
router.get('/', function (req, res, next) {
  const stateValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  req.session.stateValue = stateValue;

  //generate the pkce challenge/verifier dict
  const pkce_pair = pkceChallenge.default();
  // Store the PKCE verifier in session
  req.session.verifier = pkce_pair['code_verifier'];
  const challenge = pkce_pair['code_challenge'];

  var lang = req.query.lang;
  var studyID = req.query.studyID;
  var uniqueID = req.query.uniqueID;

  console.log(clientId);
  console.log(lang)
  console.log(studyID)
  console.log(uniqueID)

  if(lang==undefined){
    var lang = "eng"
  }
  if(studyID==undefined){
    var studyID= "main"
  }
  if(uniqueID==undefined){
    var uniqueID= "unknown"
  }

  req.session.lang=lang;
  req.session.studyID=studyID;
  req.session.uniqueID=uniqueID;

  //res.render('index', {user: req.session.user, title: 'Test', clientId: clientId, challenge: challenge, stateValue: stateValue, fusionAuthURL: fusionAuthURL});

  //Directly to auth page
  //res.redirect(302, 'http://localhost:9011/oauth2/authorize?client_id='+clientId+'&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A1052%2Foauth-redirect&scope=offline_access&state='+stateValue+'&code_challenge='+challenge+'&code_challenge_method=S256');
  //res.redirect(302, 'http://localhost:3000/oauth2/authorize?client_id='+clientId+'&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth-redirect&scope=offline_access&state='+stateValue+'&code_challenge='+challenge+'&code_challenge_method=S256');
  res.redirect(302, 'https://mmbb.ltdk.helsinki.fi/initial.html?client_id='+clientId+'&response_type=code&redirect_uri=https%3A%2F%2Fmmbb.ltdk.helsinki.fi%2Foauth-redirect&scope=offline_access&state='+stateValue+'&code_challenge='+challenge+'&code_challenge_method=S256'+'&lang='+lang+'&studyID='+studyID);

});

router.get('/postreg', function (req, res, next) {
  const stateValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  req.session.stateValue = stateValue;

  //generate the pkce challenge/verifier dict
  const pkce_pair = pkceChallenge.default();
  // Store the PKCE verifier in session
  req.session.verifier = pkce_pair['code_verifier'];
  const challenge = pkce_pair['code_challenge'];
  console.log(clientId);

  var lang = req.session.lang;
  var studyID = req.session.studyID;
  var uniqueID = req.query.uniqueID;
  //var lang = req.query.lang;
  //var studyID = req.query.studyID;

  console.log(lang)
  console.log(studyID)
  console.log(uniqueID)

  //Directly to auth page
  res.redirect(302, 'https://mmbb.ltdk.helsinki.fi:9111/oauth2/authorize?client_id='+clientId+'&response_type=code&redirect_uri=https%3A%2F%2Fmmbb.ltdk.helsinki.fi%2Foauth-redirect&scope=offline_access&state='+stateValue+'&code_challenge='+challenge+'&code_challenge_method=S256'+'&lang='+lang+'&studyID='+studyID+'&uniqueID='+uniqueID);

});

// tag::fullOAuthCodeExchange[]
/* OAuth return from FusionAuth */
router.get('/oauth-redirect', function (req, res, next) {
  console.log('in oauth-redirect');
  const stateFromServer = req.query.state;
  if (stateFromServer !== req.session.stateValue) {
    console.log("State doesn't match. uh-oh.");
    console.log("Saw: " + stateFromServer + ", but expected: " + req.session.stateValue);
    res.redirect(302, '/login');
    return;
  }

  console.log("Parameters here:")
  var lang = req.session.lang;
  var studyID = req.session.studyID;
  var uniqueID = req.session.uniqueID;
  //var lang = req.query.lang;
  //var studyID = req.query.studyID;

  console.log(lang)
  console.log(studyID)
  console.log(uniqueID)

// tag::exchangeOAuthCode[]
// This code stores the user in a server-side session
 client.exchangeOAuthCodeForAccessTokenUsingPKCE(req.query.code,
                                                 clientId,
                                                 clientSecret,
                                                 'https://mmbb.ltdk.helsinki.fi/oauth-redirect',
                                                 req.session.verifier)
// end::exchangeOAuthCode[]
      .then((response) => {
        //console.log(response.response.access_token);
        return client.retrieveUserUsingJWT(response.response.access_token);
      })
      .then((response) => {
// tag::setUserInSession[]
        req.session.user = response.response.user;
        return response;
      })
// end::setUserInSession[]
      .then((response) => {
        console.log("Eu aqui")
        console.log(response.response.user.id)
        console.log(clientId)
         
        //var queryStringIndex = window.location.search;
        //var urlParamsIndex = new URLSearchParams(queryStringIndex);

        res.redirect(302, '/chooseBattery.html?user=' + response.response.user.id + "&clientID=" + clientId + "&lang=" + lang + "&studyID=" + studyID + "&uniqueID=" + uniqueID);

      }).catch((err) => {console.log("in error"); 
        console.error(JSON.stringify(err));});
});
// end::fullOAuthCodeExchange[]

  // This code can be set in the last promise above to send the access and refresh tokens
  // back to the browser as secure, HTTP-only cookies, an alternative to storing user info in the session
  //     .then((response) => {
  //       res.cookie('access_token', response.response.access_token, {httpOnly: true});
  //       res.cookie('refresh_token', response.response.refresh_token, {httpOnly: true});
  //       res.redirect(302, '/');
  //     }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});

module.exports = router;
