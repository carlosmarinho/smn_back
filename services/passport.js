const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require('mongoose');
const keys = require("../config/keys");


const User = mongoose.model('users');

passport.serializeUser((user, done) => {
    done(null, user.id)
})

//turn the id back into an user
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then( user => {
            done(null, user);
        })
})

//Internally google's strategy has some little bit of code 
//that says i am known as a strategy called google like the string google
//So hey passport when you load me up if anyone attempts to authenticate 
//and say authenticate with a string of google use me this strategy right here
passport.use(
    new GoogleStrategy(
      {
        clientID: keys.googleClientID,
        clientSecret: keys.googleClientSecret,
        callbackURL: "/auth/google/callback",
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        //existingUser represents a model instance thats the user who was found
        const existingUser = await User.findOne( { googleId: profile.id })
            
        if(existingUser) {
            // we already have a record with the given profile ID

            //The first argument is an error object
            //The second argument is the user that was founded
            return done(null, existingUser);
        }
        
        // we don't have a user record with this ID, make a new user
        const user = await new User({ googleId: profile.id }).save()
        done(null, user);
        
            

      }
    )
  );