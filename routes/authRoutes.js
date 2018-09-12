//const passport = require('passport');

module.exports = (app, passport) => {
    app.get(
        "/auth/google",
        passport.authenticate('google', {
            //We are asking google access to the user profile and email
            scope: ["profile", "email"]
        })
    )

    app.get(
        '/auth/google/callback',
        passport.authenticate('google'),
        (req, res) => {
            res.redirect('/surveys');
        }
    )
}