import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config()

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const GoogleClient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    "postmessage"
)