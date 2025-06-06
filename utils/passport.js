import passport from 'passport';
import passportGoogle from 'passport-google-oauth20';
import dotenv from "dotenv";

dotenv.config();

const GoogleStrategy = passportGoogle.Strategy;

export function useGoogleStrategy() {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                callbackURL: '/api/auth/google/callback',
                scope: ['profile', 'email']
            },
            async (accessToken, refreshToken, profile, callback) => {
                callback(null, profile)
            }
        )
    );

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });
}